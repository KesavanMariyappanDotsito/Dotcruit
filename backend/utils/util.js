const connection = require('../db');
require('dotenv').config();
const { mouse, keyboard, Key } = require('@nut-tree-fork/nut-js');

async function automateTyping(path) {
    await keyboard.type(path);
    await keyboard.pressKey(Key.Enter);
}

const getAllFromTable = async (tableName) => {
    const data = await connection.promise().query(`SELECT * FROM ${tableName};`);
    return data[0];
}

const getFromTable = async (tableName, filterBy, filterKeyword) => {
    const data = await connection.promise().query(`SELECT * FROM ${tableName} where ${filterBy} = '${filterKeyword}';`);
    return data[0];
}

const customDate1 = (str) => { // MMM-DD-YYYY
    const [day, month, year] = str.split(',')
    return `${month.slice(0, 3)}-${day}-${year}`;
}

const currentDateTime = () => {
    const pad = (num) => num.toString().padStart(2, '0'); 
    const currentdate = new Date();
    return pad(currentdate.getDate()) + "/"
        + pad(currentdate.getMonth() + 1) + "/"
        + currentdate.getFullYear() + " "
        + pad(currentdate.getHours()) + ":"
        + pad(currentdate.getMinutes()) + ":"
        + pad(currentdate.getSeconds());
}

module.exports = { getAllFromTable, getFromTable, customDate1, automateTyping, currentDateTime }