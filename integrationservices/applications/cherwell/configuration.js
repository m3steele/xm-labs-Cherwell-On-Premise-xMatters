// ----------------------------------------------------------------------------------------------------
// Configuration settings for an xMatters Relevance Engine Integration
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// The url that will be used to inject events into xMatters.
// ----------------------------------------------------------------------------------------------------
WEB_SERVICE_URL = "https://companyname.xmatters.com/api/integration/1/functions/6dc335339/triggers";


XMATTERS_ONDEMAND = "https://companyname.xmatters.com";

WEB_SERVICE_TERMINATE_URL = "https://companyname.xmatters.com/api/integration/1/functions/c091db074/triggers";


//Constant Configuration
//CHERWELL_JOURNAL_TYPEID = "<CHERWELL-JOURNAL-TYPE-UUID-FOR-NOTE, e.g. 934d8181ba9d3a6a506d7643e1bc71f70fa9b47412>";
CHERWELL_JOURNAL_TYPEID = "934d8181ba9d3a6a506d7643e1bc71f70fa9b47412";
CHERWELL_JOURNAL_TYPENAME = "Journal - Note";

CHERWELL_INCIDENT_OBJID = "6dd53665c0c24cab86870a21cf6434ae";


// replace with task object id
CHERWELL_TASK_OBJID = "9355d5ed41e384ff345b014b6cb1c6e748594aea5b";


//Cherwell Server Address
CHERWELL_SERVER = "http://yourserveraddress.com";



//----------------------------------------------------------------------------------------------------
//The username and password used to authenticate the request to xMatters.
//The PASSWORD value is a path to a file where the
//user's password should be encrypted using the iapassword.sh utility.
//Please see the integration agent documentation for instructions.
//----------------------------------------------------------------------------------------------------

INITIATOR = "Cherwell_API_User";
PASSWORD = "integrationservices/applications/cherwell/.initiatorpasswd";

//----------------------------------------------------------------------------------------------------
//The username and password used to authenticate the request to Cherwell.
//The PASSWORD value is a path to a file where the
//user's password should be encrypted using the iapassword.sh utility.
//Please see the integration agent documentation for instructions.
//----------------------------------------------------------------------------------------------------

//CHERWELL_WS_ID = "28b67266-049e-4d93-9017-5aed1923c71e";
CHERWELL_WS_ID = "01fad7a1-f295-4f9f-98f7-ed1faa77ebd1";

CHERWELL_WS_USER = "xMatters";
CHERWELL_WS_PASSWORD = "integrationservices/applications/cherwell/.chwspasswd";


// ----------------------------------------------------------------------------------------------------
// Callbacks requested for this integration service.
// ----------------------------------------------------------------------------------------------------
CALLBACKS = ["status", "response", "deliveryStatus"];


// ----------------------------------------------------------------------------------------------------
// Filter to use in <IAHOME>/conf/deduplicator-filter.xml
// ----------------------------------------------------------------------------------------------------
//DEDUPLICATION_FILTER_NAME = "sample-relevance-engine";

