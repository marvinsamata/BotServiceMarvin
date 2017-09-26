/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var Client = require('node-rest-client').Client;
var builder_cognitiveservices = require("botbuilder-cognitiveservices");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);


// var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
//     knowledgeBaseId: process.env.QnAKnowledgebaseId,
//     subscriptionKey: process.env.QnASubscriptionKey
// });
// 
// var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
//     recognizers: [recognizer],
//     defaultMessage: 'No match! Try changing the query terms!',
//     qnaThreshold: 0.3
// }
//     );
// 
// 
// bot.dialog('/', basicQnAMakerDialog);


bot.dialog('/', [
    function (session, results, next) {
        if (!session.userData.nombre) {
            builder.Prompts.text(session,'¿Hola, cómo te llamás?');
        } else {
            //session.send(`Hola ${session.userData.nombre}, es un placer saludarte de nuevo.`);
            next();
        }
    },
    function(session, results){
        if (results.response) {
            let msj = results.response;
            session.userData.nombre = msj;
        }
        builder.Prompts.choice(session, `${session.userData.nombre}. ¿Qué deseas hacer?`, 'Ver información de un recurso|Ver todos los proyectos', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        if(results.response.index == 0) {
            session.beginDialog('/verInfoRecurso');
        } else if(results.response.index == 1) {
            session.beginDialog('/verTodosProyectos');
        }
    }
]);

bot.dialog('/verInfoRecurso', [
    function(session){
        builder.Prompts.text(session, 'Digita el id de la persona');
    }, 
    function(session, results){
        var client = new Client();
        // registering remote methods 
        client.registerMethod("jsonMethod", `http://13.65.27.193/SIRIUS_Pro_servicios/api/RecursoAPI/${results.response}`, "GET");

        client.methods.jsonMethod(function (data, response) {
            // parsed response body as js object 
            console.log(data);
            if(data != null) {
                let nombreCompleto = data[0].NombreCompleto;
                let direccion = data[0].Direccion;
                var categoria = data[0].Categoria.Descripcion;
                var correo = data[0].CorreoElectronico;
                var infoHtml = `${nombreCompleto} vive en ${direccion}. Es ${categoria} y su correo es ${correo}`;
                var heroCard = new builder.HeroCard(session)
                .title('Información de la Persona')
                .text(infoHtml)
                .images([
                    builder.CardImage.create(session, 'https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg')
                ])
                .buttons([
                    builder.CardAction.openUrl(session, 'http://13.65.27.193/Sirius_pro', 'Ver Info en Sirius')
                ]);

                // Adjuntamos la tarjeta al mensaje
                var msg = new builder.Message(session).addAttachment(heroCard);
   
                session.endDialog(msg);
            }
        });
    }
]);

bot.dialog('/verTodosProyectos',[
    function(session, results) {
        var client = new Client();
        // registering remote methods 
        client.registerMethod("jsonMethod", `http://13.65.27.193/SIRIUS_Pro_servicios/api/ProyectoAPI/0`, "GET");

        client.methods.jsonMethod(function (data, response) {
            var proyectos = [];
            for (i = 0; i < data.length -1; i++) {
                var nombreProyecto = data[i].Nombre;
                var nombreCliente = data[i].Cliente.Nombre;
                var descripcionProyecto = data[i].Descripcion;
                var heroCard = new builder.HeroCard(session)
                .title(`Proyecto ${nombreProyecto}`)
                .subtitle(`Cliente: ${nombreCliente}`)
                .text(descripcionProyecto);

                proyectos.push(heroCard);
            }
            var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(proyectos);
            session.endDialog(msg);
        });
    }
]);

function getPhoto(pIdUser){
    var client = new Client();
    // registering remote methods 
    client.registerMethod("jsonMethod", `http://13.65.27.193/SIRIUS_Pro_servicios/api/FotografiaAPI/${results.response}`, "GET");

    client.methods.jsonMethod(function (data, response) {
        if(data != null) {
            session.userData.photo = data[0][0];
        }
    });
}

