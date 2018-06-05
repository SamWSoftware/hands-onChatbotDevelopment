module.exports = class Lex {

    lexElicitSlot({ sessionAttributes = {}, message, intentName, slotToElicit, slots }) {
        return {
            sessionAttributes,
            dialogAction: {
                type: 'ElicitSlot',
                intentName,
                slots,
                slotToElicit,
                message: { contentType: 'PlainText', content: message }
            },
        };
    }

    lexClose({ message, sessionAttributes = {}, fulfillmentState = "Fulfilled" }) {
        return {
            sessionAttributes,
            dialogAction: {
                type: 'Close',
                fulfillmentState,
                message: { contentType: 'PlainText', content: message }
            }
        }
    }

    lexElicitIntent({ message, sessionAttributes = {} }) {
        return {
            sessionAttributes,
            dialogAction: {
                type: 'ElicitIntent',
                message: { contentType: 'PlainText', content: message }
            },
        };
    }

    confirmIntent({ sessionAttributes = {}, intentName, slots, message }) {
        return {
            sessionAttributes,
            dialogAction: {
                type: 'ConfirmIntent',
                intentName,
                slots,
                message: { contentType: 'PlainText', content: message }
            },
        };
    }

    delegate({ sessionAttributes = {}, slots }) {
        return {
            sessionAttributes,
            dialogAction: {
                type: 'Delegate',
                slots,
            },
        };
    }
}