const lex = require('./LexResponses');
const Lex = new lex();

exports.handler = async (event) => {
    return handleProductFind(event);
}

const handleProductFind = event => {
    let { slots } = event.currentIntent;
    let { itemNumber, type, size, colour, length } = slots;

    if (itemNumber) return getItem(slots);
    // No item number so using normal product find
    if (!type) {
        let message = 'Are you looking for a shirt, jacket or trousers?';
        let intentName = 'productFind';
        let slotToElicit = 'type';
        return Lex.elicitSlot({ message, intentName, slotToElicit, slots })
    }
    if (!size) {
        let message = `What size of ${type} are you looking for?`;
        let intentName = 'productFind';
        let slotToElicit = 'size';
        return Lex.elicitSlot({ message, intentName, slotToElicit, slots })
    }
    if (!colour) {
        let message = 'What colour would you like?';
        let intentName = 'productFind';
        let slotToElicit = 'colour';
        return Lex.elicitSlot({ message, intentName, slotToElicit, slots })
    }
    if (!length && type === 'trousers¡') {
        let message = 'Are you looking for short, standard or long trousers?';
        let intentName = 'productFind';
        let slotToElicit = 'length';
        return Lex.elicitSlot({ message, intentName, slotToElicit, slots })
    }

    return getItem(slots);
}

const getItem = async slots => {
    let { itemNumber, type, size, colour, length } = slots;
    let stock = await getStock();
    let matching = stock.filter(item =>
        itemNumber === item.itemNumber ||
        type == item.type &&
        size == item.size &&
        colour == item.colour &&
        (item.length == length || item.type != 'trousers'));
    if (matching.length !== 1) {
        let message = `Unfortunately we couldn't find the item you were looking for`;
        return Lex.lexClose({ message })
    }
    let item = matching[0];
    if (item.stock < 1) {
        let message = `Unfortunately we don't have anything matching your request in stock. Would you like to search again?`;
        let intentName = 'productFind';
        slots = { type: null, size: null, colour: null, length: null, itemNumber: null };
        return Lex.confirmIntent({ intentName, slots, message })
    }
    let message = `There are ${item.stock} ${item.colour} ${units(item.type, item.stock)} in stock. Would you like to add one to your basket?`;
    let intentName = 'addToBasket';
    slots = { itemNumber: item.itemNumber };
    return Lex.confirmIntent({ intentName, slots, message });
}

const units = (type, stock) => {
    if (type === 'trousers') {
        return `pair${stock === 1 ? 's': ''} of trousers`
    }
    return `${type}${stock === 1 ? 's': ''}`;
}

const getStock = () => {
    var params = {
        Bucket: 'shoppingStock',
        Key: `stockData.json`
    };

    return new Promise((resolve, reject) => {
        s3.getObject(params, function(err, data) {
            if (err) { // an error occurred
                reject(err)
            } else { // successful response
                resolve(JSON.parse(data.body))
            }
        });
    })
}