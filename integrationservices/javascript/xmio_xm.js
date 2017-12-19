XMIO_XM = {};

var WEB_SERVICE_URL;
var INITIATOR;
var PASSWORD;

(function(){
  var javaPkgs = new JavaImporter(
      java.io.File,
      java.io.FileReader,
      com.alarmpoint.integrationagent.script.api,
      com.alarmpoint.integrationagent.security,
      com.alarmpoint.integrationagent.exceptions.retriable,
      com.alarmpoint.integrationagent.config.IAConfigImpl,
      com.alarmpoint.integrationagent.config.xml.IAConfigFileImpl
  );

  /**
  * Path to IA configuration file
  */
  XMIO_XM.IA_CONFIG_FILE_PATH = "conf/IAConfig.xml";

  /**
  * If true, will automatically use the proxy configuration (if any) defined in the IAConfig.xml.
  * Requires an Integration Agent version that supports proxy configuration through IAConfig.xml.
  */
  XMIO_XM.AUTOCONFIGURE_PROXY = true;

  with (javaPkgs) {
    var httpClient = new IntegrationServiceHttpClient();
    XMIO_XM.http = httpClient;

    XMIO_XM.decryptFile = function(path) {
      return EncryptionUtils.decrypt(new java.io.File(path));
    }

    XMIO_XM.post = function(jsonStr, url, username, password, headers) {
      return execute('POST', jsonStr, url, username, password, headers);
    }

    XMIO_XM.put = function(jsonStr, url, username, password, headers) {
      if (url === undefined) {
        throw 'The parameter "url" needs to be defined for the function "put".';
      }
      return execute('PUT', jsonStr, url, username, password, headers);
    }

    XMIO_XM.patch = function(jsonStr, url, username, password, headers) {
      if (url === undefined) {
        throw 'The parameter "url" needs to be defined for the function "patch".';
      }
      return execute('PATCH', jsonStr, url, username, password, headers);
    }

    XMIO_XM.get = function(url, username, password, headers) {
      if (url === undefined) {
        throw 'The parameter "url" needs to be defined for the function "get".';
      }
      return execute('GET', null, url, username, password, headers);
    }

    XMIO_XM.delete = function(url, username, password, headers) {
      if (url === undefined) {
        throw 'The parameter "url" needs to be defined for the function "delete".';
      }
      return execute('DELETE', null, url, username, password, headers);
    }

    function execute(method, jsonStr, url, username, password, headers) {
      IALOG.debug("\tEntering XMIO_XM.execute with method: {0}, jsonStr: {1}, and url: {2}", method, JSON.stringify(jsonStr), url );
      var urL = url === undefined ? WEB_SERVICE_URL : url,
            user = username === undefined ? INITIATOR : username,
            pwd = password === undefined ? XMIO_XM.decryptFile(PASSWORD) : password;

      if ( XMIO_XM.AUTOCONFIGURE_PROXY && XMIO_XM.iaConfig == null )  {
        IALOG.debug("Reading configuration file: " + XMIO_XM.IA_CONFIG_FILE_PATH);
        var configFile = new File(XMIO_XM.IA_CONFIG_FILE_PATH);
        var iaConfigFile = new IAConfigFileImpl(new FileReader(configFile));
        XMIO_XM.iaConfig = new IAConfigImpl(iaConfigFile, configFile.getParentFile(), configFile.toURI());
      }

      XMIO_XM.http.setUrl(urL);

      if (user != null) {
        XMIO_XM.http.setCredentials(user, pwd);
      }

      // Note: Proxy must be configured after credentials in order to support keeping the connection open
      // (See IntegrationServiceHttpClient setProxy)
      if (XMIO_XM.AUTOCONFIGURE_PROXY && XMIO_XM.iaConfig.getProxyConfig().isProxyEnabled()) {
        if (XMIO_XM.proxyConfig == null) {
          IALOG.debug("Reading proxy configuration...");
          XMIO_XM.proxyConfig = XMIO_XM.iaConfig.getProxyConfig();
        }
        var proxyHost = XMIO_XM.proxyConfig.getHost();
        var proxyPort = XMIO_XM.proxyConfig.getPort();
        var proxyUsername = XMIO_XM.proxyConfig.getUsername();
        var proxyPassword = XMIO_XM.proxyConfig.getPassword();
        var proxyNtlmDomain = XMIO_XM.proxyConfig.getNtlmDomain();
        IALOG.debug("Adding the following proxy parameters: {0}:{1} {2}/{3} {4}", proxyHost, proxyPort, proxyUsername, proxyPassword, proxyNtlmDomain);
        XMIO_XM.http.setProxy(proxyHost, proxyPort, proxyUsername, proxyPassword, proxyNtlmDomain);
      }

      if (headers === undefined) {
        if (method !== 'GET') {
          IALOG.debug("\t\tAdding default header {0}={1}", 'Content-Type', 'application/json');
          XMIO_XM.http.addHeader('Content-Type', 'application/json');
        }
      } else if (headers != null) {
        for (header in headers) {
          IALOG.debug("\t\tAdding header {0}={1}", header, headers[header]);
          XMIO_XM.http.addHeader(header, headers[header]);
        }
      }

      var resp;
      if (method === 'POST') {
        IALOG.debug("\t\tPOST to: {0} with payload: {1}", urL, JSON.stringify(jsonStr) );
        resp = XMIO_XM.http.post(jsonStr);
      }
      else if (method === 'PUT') {
        IALOG.debug("\t\tPUT to: {0} with payload: {1}", urL, JSON.stringify(jsonStr) );
        resp = XMIO_XM.http.put(jsonStr);
      }
      else if (method === 'GET') {
        IALOG.debug("\t\tGET from: {0}", urL);
        resp = XMIO_XM.http.get();
      }
      else if (method === 'PATCH') {
        IALOG.debug("\t\tPATCH to: {0} with payload: {1}", urL, JSON.stringify(jsonStr) );
        resp = XMIO_XM.http.patch(jsonStr);
      }
      else if (method === 'DELETE') {
        IALOG.debug("\t\tDELETE from: {0}", urL);
        resp = XMIO_XM.http.delete();
      }

      var response = {};
      response.status = resp.getStatusLine().getStatusCode();
      response.body = XMIO_XM.http.getResponseAsString(resp);
      XMIO_XM.http.releaseConnection(resp);
      IALOG.info("\t\tReceived response code: {0} and payload: {1}", response.status, response.body);
      return response;
    }
  }
})();