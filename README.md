## 3. Make updates
Then, make the updates to the `README.md` file and add any other files necessary. `README.md` files are written in GitHub-flavored markdown, see [here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) for a quick reference. 


## 4. Push to GitHub
Periodically, you will want to do a `git commit` to stash the changes locally. Then, when you are ready or need to step away, do a `git push origin master` to push the local changes to github.com. 

## 5. Request to add to xM Labs
Once you are all finished, let Travis know and he will then fork it to the xMatters account and update the necessary links in the xM Labs main page. From there if you update your repo, those changes can be merged into the xMatters account repo and everything will be kept up to date!

# Template below:
---

# Cherwell On-Premise xMatters Integration
Cherwell is a leading ITSM tool capable of advanced incident management. The interface provides a framework for building complex workflow with simple point and click - no coding! - widgets. When coupled with xMatters, this integration:

* Can notify the Owned By Team or the Owned By User about details of an incident.
* Can update the Status and Owned By of the incident when a user responds to a notification.
* Can add Journal Entries to the Incident Record detailing what xMatters is doing.
* Can terminate the xMatters event when it is resolved in Cherwell.
* Once an event is sent to xMatters Integraiton Agent a Cherwell REST API Get Incident and Get Task call allows for passing any incident or task field to xMatters. Included Communication Plan will need to be modified to accomodate any additional fields passed to xMatters.
* A Cherwell webservice Onestep object or and Email can be used to trigger the xMatters event.
* Parse Email Outbound Integration script included to break up email body for email initiated events.

The Cherwell (On-Premise) communication plan contains the following __inbound__ integrations:

* __New Incident One Step__: This integration receives the HTTP POST from Integration Agent and builds the event payload. It will query to make sure the targeted recipient exists and, if not, will set the recipient to null, forcing the event to target the recipient in the New Incident form. 
* __Terminate Events__: This integration parses the Incident ID and queries for all * active events in xMatters with that Incident ID and then terminates them. 

The communication plan also contains the following __outbound__ integrations:

* __Event Delevery Notifications (IA)__: Updates the Incident Journal with devlivery information. This has been tested to work but has not been tested extensively.
* __Event Status Notifications (IA)__: Updates the Incident Journal with event status information.
* __Response Notifications (IA)__: Updates the Incident Journal with responses from users and updates the Task Status and Owned By fields if the response is "Assign to me".


<kbd>
  <img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

# Pre-Requisites
* Virtual Machine running the newest version of the xMatters Integration Agent 
* Cherwell On-Premise v8 +
* xMatters account - If you don't have one, [get one](https://www.xmatters.com)!

# Files
* [CherwellOnPremise.zip] - This the Cherwell On-Premise Communication plan.
* [Cherwell_IntegrationServices.zip] - This the xMatters Integration Service for use with the Integration Agent.

# How it works
Out of the box, the integration uses a One Step to initiate a webservice call with the record id's from Cherwell Incident and Task records to the xMatters Integration Agent. The web service makes an HTTP POST to the Integration Agent, which generates the event payload and passes it to xMatters inbound integration. The Integration Agent uses Cherwell REST API to GET Incident and Task properties from Cherwell. This is used to avoid known bugs in cherwell webservice OneStep when fields contains certain special characters. After retreiving Cherwell property values, the New Incident One Stop inbound integration is targeted from the Integration Agent.  An Automation Process is used to kick off the Cherwell One Step automatically when specified criteria are met. This cam be customized to whatever criteria you see fit. This integration was designed for Automation Processes that kickoff for all Tasks related to Priority 1 and 2 Indicents.

Before creating the event, the integration builder script will check the Assigned Group set in Cherwell is not empty. If the Assigned Group is empty, xMatters will target a hard coded group defaulted to Service Desk. This group can be changed as required.

This integration will initiate an xMatters Notification when an incident __Task Record__ is created. It will update assigned user to the Incident Task, not the Incident Record.


# Installation
Details of the installation go here. 
<br><br><br>

## xMatters set up
The first step in setting up your integration is to configure xMatters On-Demand.
<br><br><br><br><br><br><br><br><br>

### Create an integration user
This integration requires a user who can authenticate REST web service calls when injecting events.

This user needs to be able to work with events, but does not need to update administrative settings. While you can use the default Company Supervisor role to authenticate REST web service calls, the best method is to create a user specifically for this integration with the "REST Web Service User" role that includes the permissions and capabilities.

__Note__: If you are installing this integration into an xMatters trial instance, you don't need to create a new user. Instead, locate the "Integration User" sample user that was automatically configured with the REST Web Service User role when your instance was created and assign them a new password. You can then skip ahead to the next section.

__To create an integration user:__

1. Log in to the target xMatters system.
2. On the __Users__ tab, click the __Add New User__ icon.
3. Enter the appropriate information for your new user. 
    Example User Name __cherwell_API_User__
4. Assign the user to the __REST Web Service User__ role.
5. Click __Save__.
6. On the next page, set the web login ID and password. 

Make a note of these details; you will need them when configuring other parts of this integration.

This users details will be user for constants in the Integration Services Configuration Script: 
__INITIATOR__ and __PASSWORD__



### Create users and groups that will receive notifications

The integration will notify the group or user defined as the "Owned By Team". If this recipient doesn't exist in xMatters, a hard coded group (Defaulted to "Service Desk") inside of the inbound integration New Incident One Step. This group can be changed as required.

You can change this on lines 35 to 41 of Inbound Integration New Incident One Step.

__DEVELOPER tab -> Cherwell (On-Premise)__ communication plan -> __Edit Integration Builder -> Inbound Integrations -> New Incident One Step__

*This integration does not synchronize users and groups. Make sure you have created your users and groups in xMatters before using this integration.*

For more information about creating users and devices in xMatters, refer to the [xMatters On-Demand help](https://help.xmatters.com/ondemand/xmatters.htm).



### Import the xMatters Communication Plan

The next step is to import the communication plan.

To import the communication plan:

1. In the target xMatters system, on the __Developer__ tab, click __Import Plan__.
2. Click __Browse__, and then locate the downloaded communication plan: [CherwellOnPremise.zip]
3. Click __Import Plan__.
4. Once the communication plan has been imported, click __Plan Disabled__ to enable the plan.
5. In the __Edit__ drop-down list, select __Forms__.
6. For the __New Incident__ form, in the __Not Deployed__ drop-down list, click Create __Event Web Service__.
7. After you create the web service, the drop-down list label will change to __Web Service Only__.
8. In the __Web Service Only__ drop-down list, click __Permissions__.
9. Enter the REST API user you created above, and then click __Save Changes__.



### Accessing web service URLs

Each integration service has its own URL that you can use to target it from Cherwell.

__To get a web service URL for an integration service:__

1. On the Integration Builder tab, expand the list of inbound integrations.
2. Click the gear icon beside the integration service you want to target, and then select __Integration URL__.
3. If Authentication is required, click the Lock icon and note the username and password credentials. They will be needed later. 

<kbd>
  <img src="media/1_Integration URL.png"  width="478" height="294">
</kbd>

You will need the URL for each integration service when configuring Cherwell.



### Create Integration Services

This integration uses an integration services that need to be created on the "applications" event domain.

__To create the integration services:__

1. In xMatters, on the Developer tab, click Event __Domains__.
2. In the Event Domains list, click the __applications__ link.
3. On the Event Domain Details page, in the Integration Services section, click the __Add New__ link.
4. On the Integration Service Details page, in the __Name__ field, type "__cherwell__" and then click __Save__.
5. Click the __Add New__ link again.



## Configure the xMatters Integration Agent

Now that you've configured xMatters On-Demand, it's time to configure the integration agent

The installation instructions below assume you already have a working xMatters integration agent.  If this is a new installation and you have not yet deployed the integration agent please follow this link to download, deploy, and configure:

[Integration Agent for xMatters 5.x & xMatters On-Demand](https://support.xmatters.com/hc/en-us/articles/202370225)













2. Add this code to some place on what page:
   ```
   var items = [];
   items.push( { "stuff": "value"} );
   console.log( 'Do stuff' );
   ```


## Application ABC set up
Any specific steps for setting up the target application? The more precise you can be, the better!

Images are encouraged. Adding them is as easy as:
```
<kbd>
  <img src="media/cat-tax.png" width="200" height="400">
</kbd>
```

<kbd>
  <img src="media/cat-tax.png" width="200" height="400">
</kbd>


# Testing
Be specific. What should happen to make sure this code works? What would a user expect to see? 

# Troubleshooting
Optional section for how to troubleshoot. Especially anything in the source application that an xMatters developer might not know about, or specific areas in xMatters to look for details - like the Activity Stream? 
