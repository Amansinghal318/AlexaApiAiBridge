'use strict';

var Alexa = require('alexa-sdk');
var ApiAi = require('apiai');

const ALEXA_APP_ID = 'amzn1.ask.skill.app.your-skill-id';
const APIAI_DEVELOPER_ACCESS_TOKEN = 'your-apiai-developer-access-token';

var apiAi = ApiAi(APIAI_DEVELOPER_ACCESS_TOKEN);
var alexaSessionId;

exports.handler = function (event, context) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = ALEXA_APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        var self = this;
        setAlexaSessionId(self.event.session.sessionId);
        apiAi.eventRequest({name: 'WELCOME'}, {sessionId: alexaSessionId})
            .on('response', function (response) {
                var speech = response.result.fulfillment.speech;
                self.emit(':ask', speech, speech);
            })
            .on('error', function (error) {
                console.error(error.message);
                self.emit(':tell', error);
            })
            .end();
    },
    'ApiIntent': function () {
        var self = this;
        setAlexaSessionId(self.event.session.sessionId);
        var text = self.event.request.intent.slots.Text.value;
        if (text) {
            apiAi.textRequest(text, {sessionId: alexaSessionId})
                .on('response', function (response) {
                    var speech = response.result.fulfillment.speech;
                    if (response.result.actionIncomplete) {
                        self.emit(':ask', speech, speech);
                    } else {
                        self.emit(':tell', speech);
                    }
                })
                .on('error', function (error) {
                    console.error(error.message);
                    self.emit(':tell', error.message);
                })
                .end();
        } else {
            self.emit('Unhandled');
        }
    },
    'AMAZON.CancelIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.StopIntent': function () {
        var self = this;
        apiAi.eventRequest({name: 'BYE'}, {sessionId: alexaSessionId})
            .on('response', function (response) {
                self.emit(':tell', response.result.fulfillment.speech);
            })
            .on('error', function (error) {
                console.error(error.message);
                self.emit(':tell', error.message);
            })
            .end();
    },
    'Unhandled': function () {
        var self = this;
        apiAi.eventRequest({name: 'FALLBACK'}, {sessionId: alexaSessionId})
            .on('response', function (response) {
                var speech = response.result.fulfillment.speech;
                self.emit(':ask', speech, speech);
            })
            .on('error', function (error) {
                console.error(error.message);
                self.emit(':tell', error.message);
            })
            .end();
    }
};

function setAlexaSessionId(sessionId) {
    alexaSessionId = sessionId.split('amzn1.echo-api.session.').pop();
}
