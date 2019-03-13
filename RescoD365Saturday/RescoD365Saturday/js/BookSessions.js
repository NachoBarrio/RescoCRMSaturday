/***
    Library to book mysessions for D365 Saturday
    A contact will book his sessions during the event

**/
var mySessions = function () {


    var _sessionId = null;

    /**
     * this function add the session clicked to the contact´s sessions
     * @param sessionID 
     * */
    function onClickBooking(sessionID) {
        _sessionId = sessionId;
        MobileCRM.Configuration.requestObject(
            function (config) {
                if (config.isOnline) {
                    var settings = config.settings;
                    MobileCRM.bridge.alert("GUID del usuario logado: " + settings.systemUserId + ", nombre: " + settings.userLogin + ", usuario: " + settings.userName);
                    MobileCRM.bridge.alert("GUID del formulario: " + config.entity.properties["new_sessionid"]);
                    //addSession(settings.systemUserId);
                } else {
                    MobileCRM.bridge.alert("Sin conexión a internet no se tiene acceso a la recarga");
                    MobileCRM.bridge.closeForm();
                }
                return false;
            },
            function (err) {
                MobileCRM.bridge.alert("Error: " + err);
            },
            null
        );
    }
    /**
     * Retrieve logged user contact and invoke mySessions creation
     * @param {string} userId
     */
    function addSession(userId) {
        var xmlData = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "<entity name='contact'>" +
            "<attribute name='contactid' />" +
            "<order attribute='fullname' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='new_username' operator='eq' value='pepe' />" +
            "</filter>" +
            "</entity>" +
            "</fetch>";
        var promise = new Promise(() => (resolve, reject){
            MobileCRM.FetchXml.Fetch.executeFromXML(
                xmlData,
                function (result) {
                    resolve(result);
                },
                function (err) {
                    reject(err);
                },
                null
            );
        }).then(() => (resolve, reject){
            var contactid = resolve[i][0];
            createMySession(contactid);
        });
    }
    /**
     * Add the current session to the contact logged
     * @param {guid} contactid
     */
    function createMySession(contactid) {

        var mySession = new MobileCRM.DynamicEntity.createNew("new_mysession");
        mySession.properties["new_contactid"] = new MobileCRM.DynamicEntity("contact", contactid);
        mySession.properties["new_sessionid"] = new MobileCRM.DynamicEntity("new_session", _sessionId);
        mySession.save(
           function (err){
            if (!err) {
                MobileCRM.bridge.alert("Session reservada");
            }
            else
                MobileCRM.bridge.alert("Error  creando la transferencia: " + err);
           }, null);
    }

    return {

    }
}();