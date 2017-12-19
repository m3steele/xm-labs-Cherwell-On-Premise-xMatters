load("integrationservices/applications/cherwell/configuration.js");
load("lib/integrationservices/javascript/event.js");
load("integrationservices/javascript/xmio_xm.js");
load("integrationservices/javascript/moment.js");


cherwell_access_token = "undefined";
cherwell_refresh_token = null;
cherwell_access_expire = null;



function apia_remapped_data() {
    return {
        "priority" : "priority"
    }
}

function apia_event(form)
{
    // APClient.bin injection has been converted to a JavaScript object
    // that can be serialized and sent to xMatters.
    IALOG.info(JSON.stringify(form, null, 2));

    //Un-comment below to update the injected value of the property city.
    //form.properties.city = "Victoria";

    return form;
}



//============================= 
//============================= 
// Initiate Call Back Function
//============================= 
//============================= 

function apia_callback(msg)
{








    var str = "Received message from xMatters:\n";
    str += " [xMatters] Update: " + msg.incident_id;
    str += "\n [xMatters] Event Id: " + msg.eventidentifier;
    str += "\n Callback Type: " + msg.xmatters_callback_type;
    IALOG.info(str);

	
     // Handle callbacks, such as status, delivery status and user response
     handleCallbacks(msg);
}

function apia_http(httpRequestProperties, httpResponse)
{
    // This example demonstrates converting an XML document sent to the Integration Agent
    // into a JavaScript object.
    // Since input XML documents can vary dramatically, some techniques are presented for
    // accessing the data and converting it to JSON that can be sent to xMatters.

    // 1. Convert payload to E4X XML object
    var data = XMUtil.parseXML(httpRequestProperties.getProperty("REQUEST_BODY"));

	//1.a. have to declare the three namespaces used in the XML object, or else we can't get to the data
	var envNs = new Namespace("http://schemas.xmlsoap.org/soap/envelope/");

    // 2. Get a JS object with callback properties based on CALLBACK value in configuration.js
    var event = XMUtil.createEventTemplate();
    IALOG.info("Initial event template:\n" + JSON.stringify(event, null, 2)); // pretty print json

    // 3. Create properties
//    IALOG.info("String to be converted to array: " + String(data.*::Body.*::IntegtrationServiceRequest.*::IntegtrationServiceRequest.*::id));
//   var strippedQuotes = String(data.*::Body.*::IntegtrationServiceRequest.*::IntegtrationServiceRequest.*::id)).replace(/\"/g, ''); //Strip double quotes
//    IALOG.info("Stripped quotes: " + strippedQuotes);
//    var array = strippedQuotes.split(','); //Split the string into an array
//    array = array.map(function(item){
//        return item.trim();
//    });
//    IALOG.info("Array: " + JSON.stringify(array));

//NOTES FOR ADDING ADDITIONAL FIELDS: Add the additional Web Service Parameters from Cherwells below following the pattern outlined.  
//For any changes to take effect run the following commands 



	event.properties = {};
   	event.properties['Incident Rec ID'] = String(data.*::Body.*::IntegrationServiceRequest.*::IntegrationServiceRequest.*::Incident_Rec_ID);
    event.properties['Incident ID'] = String(data.*::Body.*::IntegrationServiceRequest.*::IntegrationServiceRequest.*::Incident_ID);
	event.properties['Task Rec ID'] = String(data.*::Body.*::IntegrationServiceRequest.*::IntegrationServiceRequest.*::Task_Rec_ID);
	event.properties['Task ID'] = String(data.*::Body.*::IntegrationServiceRequest.*::IntegrationServiceRequest.*::Task_ID);
	event.properties['Type ID'] = CHERWELL_JOURNAL_TYPEID;



// ====================================================================================
// ====================================================================================
// Get additional field values from cherwell that we could not pass in the Original Webservice Request because of Special Characters.
//
// A. Get Incident
// B. Get Task
// C. Proceed to Send xMatters Event
// ====================================================================================
// ====================================================================================





// ***
// A. Get Incident
// ***

IncidentRecord = getIncidentRecord (event.properties['Incident ID']);

 IALOG.info("IncidentRecord Returned: " + JSON.stringify(IncidentRecord));

	event.properties['Short Description'] = IncidentRecord.fields[182].value;
	event.properties.Description = IncidentRecord.fields[12].value;
	event.properties.Category =  IncidentRecord.fields[9].value;
   	event.properties.Subcategory = IncidentRecord.fields[10].value;
   	event.properties.Priority = IncidentRecord.fields[15].value;
	event.properties.Service = IncidentRecord.fields[8].value;
	event.properties['IT Performance Issue'] = IncidentRecord.fields[221].value;
	event.properties['Major Incident'] = IncidentRecord.fields[167].value;


// ***
// B. Get Task
// ***

TastRecord = getTaskRecord (event.properties['Task ID']);


IALOG.info("TaskRecord Returned: " + JSON.stringify(TastRecord));

	event.properties['Assigned Group'] = TastRecord.fields[8].value;
	event.properties.Status = TastRecord.fields[60].value;
	


// ***
// C. Proceed to Send xMatters Event
// ***	


    IALOG.info("Properties added to event:\n" + JSON.stringify(event, null, 2));

    // 4. Deduplicate based on form properties
    if (XMUtil.deduplicator.isDuplicate(event.properties)) {
        // Discard message, adding a warning note to the log
        XMUtil.deduplicate(event.properties);
        return;
    }


    // 5. Create recipients
    event.recipients = [];
  //  var recipients = data.*::recipients.*::targetName; // This is an XMLList
  //	data.*::Body.*::IntegrationServiceRequest.*::IntegrationServiceRequest.*::assigned_group;
	var recipients = data.*::Body.*::IntegrationServiceRequest.*::IntegrationServiceRequest.*::Assigned_Group;  // This is an XMLList
    for each (var recipient in recipients) {
        var recipientAsJavascriptObject = specificXmlParsingLogic(recipient);
        event.recipients.push(recipientAsJavascriptObject); // add to array
    }
    IALOG.info("Recipients added to event:\n" + JSON.stringify(event, null, 2));
			
		

 IALOG.info("STATUS TERM.ACTIVE: " + event.properties.Status + "other TastRecord.fields[60].value " + TastRecord.fields[60].value);
		

IALOG.info("STATUS TERM!: " + JSON.stringify(event.properties));		

	if (event.properties.Status == "New") {	
		
    // 6. Send to xMatters (CREATE NEW EVENT)

    XMIO_XM.post(JSON.stringify(event),WEB_SERVICE_URL,INITIATOR,XMIO_XM.decryptFile(PASSWORD)); // No need for formatting

IALOG.info("STATUS ACTIVE!: " + event.properties.Status);


    // 7. If the post succeeded, register the event with the deduplication filter.
    XMUtil.deduplicator.incrementCount(event.properties);
	
	}
	
	else {

IALOG.info("STATUS TERM!!: " + JSON.stringify(event));	
IALOG.info("STATUS TERM!!: " + JSON.stringify(event.properties));			
    // 6B. Send to xMatters (TERMINATE EXISTING EVENT)
    XMIO_XM.post(JSON.stringify(event),WEB_SERVICE_TERMINATE_URL,INITIATOR,XMIO_XM.decryptFile(PASSWORD)); // No need for formatting
	
IALOG.info("STATUS TERM!: " + event.properties.Status);	
	}
	
}



function specificXmlParsingLogic(xmlText)
{
    // This code demonstrates converting the text value of:
    //     <targetName>bsmith</targetName>
    //   or
    //     <targetName>tsanderson, devices: ["Email", "Voice Phone"]</targetName>
    // To:
    //     { "targetName": "bsmith" }
    //   or
    //     {
    //       "targetName": "tsanderson",
    //       "devices": ["Email", "Voice Phone"]
    //     }

    var index = String(xmlText).indexOf(','),
         deviceFilterPresent = (index > -1);
    var jsObj = {};

    if (deviceFilterPresent) {
        var targetName = xmlText.slice(0, index);
        jsObj.targetName = targetName;

        var deviceArray = xmlText.slice(index+1).trim().split(':'), // Strip ,
            key = deviceArray[0].trim(),
            value = JSON.parse(deviceArray[1].trim());
        jsObj[key] = value;
    }
    else {
        jsObj.targetName = String(xmlText);
    }

    return jsObj;
}







//============================= 
//============================= 
// Call Backs to update Cherwell Ticket and Journal Notes
//============================= 
//============================= 


/**
 * Used to update Cherwell incident ticket using web services
 * <p>
 * The main routine for handling xMatters callbacks, such as status and response
 * <p>
 * Throw an exception that will be logged by the Integration Agent.
 */


 
	function handleCallbacks(msg) 
	{
	  var recordId = msg.additionalTokens.record_id;
	  var callbackType = msg.xmatters_callback_type;
	  

  
  
 //=============================  
 // STATUS CALLBACK 
 //============================= 
  if (callbackType.equalsIgnoreCase("STATUS")) {
 
    var status = msg.status;
    var eventId = msg.eventidentifier;
    var incidentId = msg.additionalTokens.incident_id;


   try {
    

     // 2. Create journal entry about xMatters event injection
      if (status.equalsIgnoreCase("ACTIVE")) {

	 
		// This is the JournalNote Object ID that needs to be 
		// passed for making journal items. 

		//var journalNoteID = CHERWELL_JOURNAL_TYPEID;
		var journalNoteID = getJournalNoteObjectID();
		
		if( journalNoteID === null ) {
			IALOG.debug( 'Error getting journal note, exiting script.' );
			return;
		}

		// Construct Journal Note
		var journal = 'xMatters (' + eventId + '): Status set to ' + status + ' for ' + msg.additionalTokens['Assigned Group'];

		// msg.additionalTokens[ 'Type ID' ] is the xmatters field that we passed the task id for from cherwell originally.
	sendCreateJournal_resp = sendCreateJournal( journalNoteID, msg.additionalTokens[ 'Type ID' ], msg.additionalTokens[ 'Incident Rec ID' ], journal );
	
IALOG.info("sendCreateJournal_resp: " + sendCreateJournal_resp);
		
      }
    }
    catch (e) {
	
		//IALOG.debug("catch e error");
		IALOG.error("handleCallbacks() - Caught exception processing annotation for event injection. Exception:" + e.toString());
 
  
    }
  }  
  	  




 
 //=============================  
 //RESPONSE CALLBACK
 //=============================  
  else if (callbackType.equalsIgnoreCase("RESPONSE")) {
 
 
	// Handle bug with responses without annotations
	if (msg.annotation == "null") {
		msg.annotation = null;
	}
	

	//Get xMatters First and Last Name from xMatters UserID	for updating Cherwell Incident OwnedBy field
	 IALOG.info("Get USer from xMatters.  msg.recipient: " +  msg.recipient + " initiator: " + INITIATOR + "passowrd: " + XMIO_XM.decryptFile(PASSWORD) );

	var temp = XMIO_XM.get(XMATTERS_ONDEMAND + "/api/xm/1/people/" + msg.recipient, INITIATOR, XMIO_XM.decryptFile(PASSWORD));
	var resp = JSON.parse( temp.body );

	 IALOG.info("Get USer from xMatters resp: " + JSON.stringify(resp));	
	 
    try {
	
		var journalNoteID = getJournalNoteObjectID();
		if( journalNoteID === null ) {
			IALOG.debug( 'Error getting journal note, exiting script.' );
			return;
		}

		if( msg.response == 'Assign to me' ) {
			
			// Cherwell Incident OwnedBy field requires either a Cherwell User Record ID (Not User ID) or a FirstName LastName
			var fieldMap = [
			  // If you want to update any Additional fields in Cherwell add them here
 
			  { "name": 'Status',      'value': 'Acknowledged', 'dirty': true  },
			  { "name": 'OwnedBy',     'value': resp.properties["Cherwell Display Name"], 'dirty': true  }	  


			];

			 IALOG.info("Assign cherwell user fieldMap: " + JSON.stringify(fieldMap) + " and CHERWELL_INCIDENT_OBJID " + CHERWELL_INCIDENT_OBJID + " msg.additionalTokens[ 'Incident Rec ID' ] " +  msg.additionalTokens[ 'Incident Rec ID' ] + " msg.additionalTokens[ 'Incident ID' ] " + msg.additionalTokens[ 'Incident ID' ] + " msg.additionalTokens['Task Rec ID']: " + msg.additionalTokens['Task Rec ID'] +  " msg.additionalTokens['Task ID']: " + msg.additionalTokens['Task ID']);


 IALOG.info("msg: " + JSON.stringify(msg));			
			
			// Update incident
	//		sendUpdateIncident( 
	//		  CHERWELL_INCIDENT_OBJID, 
	//		  msg.additionalTokens[ 'Incident Rec ID' ], 
	//		  msg.additionalTokens[ 'Incident ID' ],
	//		  fieldMap
	//		);

			// Update task
			sendUpdateIncident( 
			  CHERWELL_TASK_OBJID,
			  msg.additionalTokens['Task Rec ID'], 
			  msg.additionalTokens['Task ID'],
			  fieldMap
			);

		}
		
		//==============================================
		// Add  additional msg responses processing here
		//==============================================
		
		
		
		//Create Journal Record for all responses
		var journal = 'xMatters (' + msg.eventidentifier + '): ' + msg.recipient + ' responded with ' + msg.response + '.';
		if ( msg.annotation ) {
			journal = journal + ' ' + msg.annotation;
		}
		
		//Create Journal Record
	journal_resp = sendCreateJournal( journalNoteID, msg.additionalTokens[ 'Incident ID' ], msg.additionalTokens[ 'Incident Rec ID' ], journal );

		


 IALOG.debug("Journal Resp: " + JSON.stringify(journal_resp));
		
        }
    catch (e) {
		
      IALOG.error("handleCallbacks() - Caught exception processing responseAction [" + msg.response +"] Exception:" + e.toString());
  
		}
  }




 





//=============================  
 //DELIVERY CALLBACK
 //=============================  
 else if (callbackType.equalsIgnoreCase("deliveryStatus")) {



  var deliveryStat = msg.deliveryStatus;
  var device = msg.device;
  var eventType = msg.eventType;
  var message = msg.message;
  var recipient = msg.recipient;
  var eventId = msg.eventidentifier;
  var incidentId = msg.additionalTokens.incident_id;




   try {
    

    	 // 2. Create journal entry about xMatters delivery update
 	 
		// This is the JournalNote Object ID that needs to be 
		// passed for making journal items. 
		//var journalNoteID = CHERWELL_JOURNAL_TYPEID;

		var journalNoteID = getJournalNoteObjectID();
		
		if( journalNoteID === null ) {
			IALOG.debug( 'Error getting journal note, exiting script.' );
			return;
		}

		// Construct Journal Note
		var journal = 'xMatters (' + eventId + '): ' + message + ' to '  + recipient + ' in the ' + msg.additionalTokens['Assigned Group'] + ' team on ' + device + '.';


	delivery_journal_res = sendCreateJournal( journalNoteID, msg.additionalTokens[ 'Type ID' ], msg.additionalTokens[ 'Incident Rec ID' ], journal );
	
	IALOG.debug("Delivery Journal Res: " + delivery_journal_res);
		
      
    }
    catch (e) {
	
		//IALOG.debug("catch e error");
		IALOG.error("handleCallbacks() - Caught exception processing annotation for delivery journal injection. Exception:" + e.toString());
 
  
    }



}



  else {
	  
      IALOG.error("handleCallbacks() - Unrecognized callback type.");
 
 	}

  
} // End handleCallbacks(msg) 







//============================================== 
//==============================================  
// Functions
//============================================== 
//==============================================  
    
/*
 * sendUpdateIncident - Update the incident with the field names and values passed in. 
 *
 * incidentObjId - The Incident Object ID. Passed from the event
 * incidentRecId - The Incident Record ID. Passed from the event
 * incidentPubId - The Public ID of the incident. Passed from the event
 * fieldMap - The name/value pairs of fields to update in the incident. Note that the names in
 *   this map should be the actual field name, NOT the displayName. 
 *
 */
function sendUpdateIncident( incidentObjId, incidentRecId, incidentPubId, fieldMap ) {
  
  // Since fieldMap is an array of objects but the template needs the names,
  // we extract out the names and stuff them into an array. This function
  // just iterates over each element and returns the name and the whole
  // thing returns an array of the names. 
  var fieldNames = fieldMap.map( function( item ){ return item.name } );

  // Go get the Object Template from Cherwell. This way we don't have 
  // to care about the field Ids. 
   
  var template = getObjectTemplate( incidentObjId, fieldNames );

  // Set the values based on the map that gets passed in. 
  for( i in fieldMap ) {
      template.setValue( fieldMap[i].name, fieldMap[i].value, fieldMap[i].dirty );
  }

  IALOG.debug('sendUpdateIncident Template: ' + JSON.stringify( template ) );
  
  // template.fields
  var payload = {
    "busObId": incidentObjId,
    "busObRecId": incidentRecId,
    "busObPublicId": incidentPubId,
    "fields": template.fields
  };

  IALOG.debug('sendUpdateIncident Payload: ' +  JSON.stringify(payload));
  IALOG.debug('Fields (2) Payload: ' +  JSON.stringify(template.fields));


//	var temp = XMIO.post(JSON.stringify(payload), CHERWELL_SERVER + "/CherwellApi/api/V1/savebusinessobject", "", "", xmio_POST_header);

	var temp = XMIO.post(JSON.stringify(payload), CHERWELL_SERVER + "/CherwellApi/api/V1/savebusinessobject", "", "", cw_header("POST"));
	var resp = JSON.parse( temp.body );
}

  
  

  
  
  
  
/* 
 * getJournalNoteObjectID - Gets the JournalNote Object ID from 
 *   Cherwell. This is needed for making a JournalNote entry.
 * 
 */ 
function getJournalNoteObjectID() {
	

//	var temp = XMIO.get(CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobjectsummaries/type/GROUPS", "", "", xmio_GET_header);

	var temp = XMIO.get(CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobjectsummaries/type/GROUPS", "", "", cw_header("GET"));
	
	if( temp.status != 200 ) {
		IALOG.debug( 'ERROR: Could not retrieve JournalNote Object ID' );
		return null;
	}


	var data = JSON.parse( temp.body );

    // This is an array of objects and buried in the 
    // Journal object is our JournalNote.
	for( var i=0; i<data.length; i++ ) {
	  IALOG.debug( 'Checking: ' + data[i].name );
	  
	  if( data[ i ].name == 'Journal' ) {
	   IALOG.debug( 'Found Journal!' );
	    for( var j=0; j<data[ i ].groupSummaries.length; j++ ) {
	        
	        IALOG.debug('    Checking: ' + data[i].groupSummaries[j].name );
	    	if( data[ i ].groupSummaries[ j ].name == 'JournalNote' ) {
	    		IALOG.debug( 'Found!: ' + data[ i ].groupSummaries[ j ].busObId );
	    		return data[ i ].groupSummaries[ j ].busObId;
	    	}
	    }
	  }
	}

	return null;
}

  
  
  
  
  
  
/*
 * sendCreateJournal - Send the request to create the journal note with given journal object
 *   id, parent object and record Ids and the message to add to the note
 *
 * journalObjId - The Journal - Note object ID. Check the install guide on how to find this value
 * incidentObjId - The Incident Object ID. Used to set the ParentTypeID of the journal
 *  ==> This needs to be set to the ID of the TASK OBJECT. 
 * incidentRecId - The parent TASK record ID.
 * message - The message to store in the journal note
 */
 
function sendCreateJournal( journalObId, incidentObjId, incidentRecId, message ) {

  var fieldNames = [ "JournalTypeID", "JournalTypeName", "ParentTypeID", "ParentRecID", "Details" ];

  var template = getObjectTemplate( journalObId, fieldNames );

	  template.setValue( 'JournalTypeID',    journalObId, true );
	  template.setValue( 'JournalTypeName', 'Journal - Note', true );
	  template.setValue( 'ParentTypeID',    incidentObjId, true );
	  template.setValue( 'ParentRecID',     incidentRecId, true );
	  template.setValue( 'Details',         message, true );

	  IALOG.debug('sendCreateJournal template: '  + template);

  
  // template.fields
  var payload = {
  "busObId": journalObId,
  "busObRecId": "",
  "busObPublicId": "",
  "fields": template.fields,
  };
  
// var temp = XMIO.post(JSON.stringify(payload), CHERWELL_SERVER + "/CherwellAPI/api/V1/savebusinessobject", "", "", xmio_POST_header);

 var temp = XMIO.post(JSON.stringify(payload), CHERWELL_SERVER + "/CherwellAPI/api/V1/savebusinessobject", "", "", cw_header("POST"));
 var resp = JSON.parse( temp.body );
 
}

  

  
  
  
  
  /* 
 * getObjectTemplate - Gets the template, complete with the
 *   field Ids and such. It adds a helper function called 
 *   setValue that will set the value of a field. Otherwise
 *   looping through and setting the field is a lot of code
 * 
 *  objId - The Object ID to get the template for
 *  fieldNames - An array of field names to retrieve
 */
function getObjectTemplate( objId, fieldNames ) {
  

  var payload = {
    "busObId": objId,
    "includeRequired": false,
    "includeAll": false,
    "fieldNames": fieldNames
  };
  IALOG.debug('GetObjectTemplate payload: ' +  payload);

//  var temp = XMIO.post(JSON.stringify(payload), CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobjecttemplate", "", "", xmio_POST_header);

  var temp = XMIO.post(JSON.stringify(payload), CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobjecttemplate", "", "", cw_header("POST"));
  var resp = JSON.parse( temp.body );

  
  var template = {};
  template.fields = resp.fields;

  // This is a helper function for setting the value of 
  // a field. The "dirty" element isn't documented, but
  // seems to allow for some kind of escaping. 
  template.setValue = function( name, value, dirty ) {
      
    dirty = ( dirty === null ? true : dirty );
      
    for( i in this.fields ) {
      if( this.fields[i].name == name ) {
        this.fields[i].value = value;
        this.fields[i].dirty = dirty;
        return;
      }
    }
  };
 IALOG.debug("return template 000");
  return template;
}
 



/* =================================================================
 * =================================================================
 *
 * getIncidentRecord - Gets the Incident Record from Cherwell.
 *   
 * =================================================================
 * =================================================================
 */ 

function getIncidentRecord (Incident_ID) {
	

//	var IncidentRecord = XMIO.get(CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobject/busobid/" + CHERWELL_INCIDENT_OBJID + "/publicid/" + Incident_ID, "", "", xmio_GET_header);

	var IncidentRecord = XMIO.get(CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobject/busobid/" + CHERWELL_INCIDENT_OBJID + "/publicid/" + Incident_ID, "", "", cw_header("GET"));
	
	if( IncidentRecord.status != 200 ) {
		IALOG.info( 'ERROR: Could not retrieve IncidentRecord' );
		return null;
	}


	var data = JSON.parse( IncidentRecord.body );
 	


	return data;
}






/* =================================================================
 * =================================================================
 *
 * getTaskRecord - Gets the TasK Record from Cherwell.
 *   
 * =================================================================
 * =================================================================
 */ 

function getTaskRecord(Task_ID) {
	

//	var TaskRecord = XMIO.get(CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobject/busobid/" + CHERWELL_TASK_OBJID + "/publicid/" + Task_ID, "", "", xmio_GET_header);

	var TaskRecord = XMIO.get(CHERWELL_SERVER + "/CherwellAPI/api/V1/getbusinessobject/busobid/" + CHERWELL_TASK_OBJID + "/publicid/" + Task_ID, "", "", cw_header("GET"));
	
	if( TaskRecord.status != 200 ) {
		IALOG.info( 'ERROR: Could not retrieve TaskRecord' );
		return null;
	}


	var data = JSON.parse( TaskRecord.body );
 	

	return data;
}







/* =================================================================
 * =================================================================
 *
 * Get oAuth Function
 *   
 * =================================================================
 * =================================================================
 */ 


//
//Set OAuth Header
/*============================= 
 * FOR HELP SEE: https://cherwellsupport.com/WebHelp/en/8.2/printed_guides/cherwell_rest_api/csm_rest_api_landing_page.html
 *auth_mode = 
 * If you are having trouble authenticating try changing your auth mode to windows. 
 * You may need to provide your domain as part of your user name:
 * domain\username
 * may need \\ to escape
*/




//Input value for function is a string of either "POST" or "GET"

function cw_header(get_put) {


IALOG.info("cherwell_access_token Value: " + cherwell_access_token);

// Get Access Token first time
if (cherwell_access_token == "undefined") {

	IALOG.info("cherwell_access_token: Access Token Undefined. Gettin OAuth token");

	var auth_header = {"Content-Type": "application/x-www-form-urlencoded"};
	var payload = "grant_type=password&client_id=" + CHERWELL_WS_ID + "&username=cherwell\\" + CHERWELL_WS_USER + "&password=" + XMIO.decryptFile(CHERWELL_WS_PASSWORD);

	var token_resp = XMIO.post(payload, CHERWELL_SERVER + "/CherwellApi/token?auth_mode=internal", "", "", auth_header);
	var token = JSON.parse(token_resp.body);
	IALOG.debug("OAUTH TOKEN: " + token);

		if (get_put == "POST") {

			//Set OAuth Header for XMIO.post
			xmio_header = {
				 "Content-Type" : "application/json",
				 "Authorization" : token.token_type + " " + token.access_token
			 };
			 
		}
		else if (get_put == "GET") {
			 
			//Set OAuth Header for XMIO.get
			xmio_header = {
			"Accept" : "application/json",
				"Authorization" : token.token_type + " " + token.access_token
			 };
			 

		}

	cherwell_access_token = token.access_token;
	cherwell_refresh_token = token.refresh_token;
	cherwell_access_expire  = moment(token['.expires']);
	
	
	IALOG.info("momentDate: " + cherwell_access_expire  );
	IALOG.info("RightNow: " +  moment());
	IALOG.info("token['.expires']: " + token['.expires'] );
	IALOG.info("expires_in: " + token.expires_in );



	return xmio_header;


} // close if

// Access token defined
else {

	IALOG.info("cherwell_access_token: Access Token Defined. Checking if Token is Valid or Expired");
	IALOG.info("currentTime " +  moment());
	IALOG.info("expiredTime " + cherwell_access_expire );



	var current_Time = moment();
	
	//Access token still Valid
	if (current_Time < cherwell_access_expire ) {

		IALOG.info("cherwell_access_token: Not Expired");

		
		if (get_put == "POST") {

			//Set OAuth Header for XMIO.post
			xmio_header = {
				 "Content-Type" : "application/json",
				 "Authorization" : "Bearer " + cherwell_access_token 
			 };
			 
		}
		else if (get_put == "GET") {
			 
			//Set OAuth Header for XMIO.get
			xmio_header = {
			"Accept" : "application/json",
				"Authorization" : "Bearer " + cherwell_access_token 
			 };
			 

		}
		

		IALOG.info("xmio_header " + JSON.stringify(xmio_header) );

		
		return xmio_header;

	}  
	
	// Access token Expired request new token using refresh token
	else {

	

	IALOG.info("cherwell_access_token: Expired. Must request new token.");

	var auth_header = {"Content-Type": "application/x-www-form-urlencoded"};
	var payload = "grant_type=password&client_id=" + CHERWELL_WS_ID + "&username=cherwell\\" + CHERWELL_WS_USER + "&password=" + XMIO.decryptFile(CHERWELL_WS_PASSWORD);

	IALOG.info("Payload new b/c of expired toekn: " + JSON.stringify(payload));

	var token_resp = XMIO.post(payload, CHERWELL_SERVER + "/CherwellApi/token?auth_mode=internal", "", "", auth_header);
	var token = JSON.parse(token_resp.body);
	
	IALOG.debug("OAUTH TOKEN: " + token);





	
		


// if you want to use refresh toekn instead of auth token
//
//		var auth_header = {"Content-Type": "application/x-www-form-urlencoded"};
//		var payload = "grant_type=refresh_token&client_id=" + CHERWELL_WS_ID + "&refresh_token=" + cherwell_refresh_token;

//		IALOG.info("payload new b/c of expired: " + JSON.stringify(payload));

//		var token_resp = XMIO.post(payload, CHERWELL_SERVER + "/CherwellApi/token?auth_mode=internal", "", "", auth_header);
//		var token = JSON.parse(token_resp.body);
		
//		IALOG.info("OAUTH TOKEN: " + token);

// ========================================================




		// Set New tokens before creating the new headers.

		cherwell_access_token = token.access_token;
		cherwell_refresh_token = token.refresh_token;
		cherwell_access_expire  = moment(token['.expires']);


			
		if (get_put == "POST") {

			//Set OAuth Header for XMIO.post
			xmio_header = {
				 "Content-Type" : "application/json",
				 "Authorization" : token.token_type + " " + cherwell_access_token 
			 };
			 
		}
		else if (get_put == "GET") {
			 
			//Set OAuth Header for XMIO.get
			xmio_header = {
			"Accept" : "application/json",
				"Authorization" : token.token_type + " " + cherwell_access_token 
			 };
			 

		}


		IALOG.info("cherwell_access_expire date: " + cherwell_access_expire );
		
	return xmio_header;

	} // close else


	
} // close else




} // end function