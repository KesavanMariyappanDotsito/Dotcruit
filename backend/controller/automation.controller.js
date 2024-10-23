const connection = require('../db');
require('dotenv').config();
const { Builder, By, Key, until, Select } = require('selenium-webdriver');
const { getAllFromTable, customDate1, automateTyping, currentDateTime, getFromTable } = require('../utils/util');
const path = require('path');

const automationController = async (req, res) => {
    const fields = await getAllFromTable('candidate');
    const { id } = req.params

    const fieldsFilter = fields.filter((field) => {
        return field.status == 'New' || field.isProcessing == 0
    });
    let groupedByPortal = {}
    groupedByPortal = fieldsFilter.reduce((acc, field) => {
        const portal = field.portal;

        if (!acc[portal]) acc[portal] = [];

        acc[portal].push(field);
        return acc;
    }, {});

    if (id) {
        groupedByPortal = {}
        const filteredWithID = fields.find(field => field.id == id)
        groupedByPortal[filteredWithID.portal] = [filteredWithID]
    }

    const portalCredentials = await getAllFromTable('portal');
    const workflow = await getAllFromTable('workflow');

    const portalArr = Object.keys(groupedByPortal);
    portalArr.forEach((portal) => {
        const portalWorkflow = workflow.find(workflow => workflow.portal === portal) || {};
        const portalCredential = portalCredentials.find(credential => credential.portal === portal) || {};

        if (Object.keys(portalWorkflow).length > 0) {
            groupedByPortal[portal].forEach(async (candidate) => {
                await automateInPortal(candidate, portalCredential, portalWorkflow);
            });
        }
    });

    res.json({ workflow });
}

async function automateInPortal(candidate, portal, workflow) {

    let driver = await new Builder().forBrowser("chrome").build();
    let status;
    let responseLog = ""
    let conditional_clause = 0
    try {
        const updateQuery = `
            UPDATE candidate
            SET isProcessing = ?
            WHERE \`id\` = ?;
        `;

        const re = await connection.promise().query(updateQuery, [1, candidate.id]);

        await driver.get(portal.portal_url);
        await driver.manage().window().maximize();

        for (const action of workflow?.actions || []) {
            let valueToSend;
            const columnName = action.columnName

            // Evaluate the value_field in the context of candidate or portal
            if (action.value_field && action.value_field.includes('.')) {
                const [context, field] = action.value_field.split('.');
                if (context === 'candidate') {
                    valueToSend = candidate[field];
                } else if (context === 'portal') {
                    valueToSend = portal[field];
                }
            }
            if (action.value_field && action.value_field.includes(',') && action.value_field.includes('.')) {
                valueToSend = ""
                action?.value_field?.split(',').forEach((value) => {
                    const [context, field] = value.split('.');
                    if (context === 'candidate') {
                        valueToSend += candidate[field] + ",";
                    } else if (context === 'portal') {
                        valueToSend += portal[field] + ",";
                    }
                })
            }

            if (conditional_clause == 1 && action.subflow?.length > 0) {
                for (const flow of action.subflow || []) {
                    if (flow.value_field && flow.value_field.includes('.')) {
                        const [context, field] = flow.value_field.split('.');
                        if (context === 'candidate') {
                            valueToSend = candidate[field];
                        } else if (context === 'portal') {
                            valueToSend = portal[field];
                        }
                    }
                    if (flow.value_field && flow.value_field.includes(',') && flow.value_field.includes('.')) {
                        valueToSend = ""
                        flow?.value_field?.split(',').forEach((value) => {
                            const [context, field] = value.split('.');
                            if (context === 'candidate') {
                                valueToSend += candidate[field] + ",";
                            } else if (context === 'portal') {
                                valueToSend += portal[field] + ",";
                            }
                        })
                    }

                    if (flow.conditional_field && flow.conditional_field == 1) {
                        try {
                            const res = await executeActions(driver, flow, valueToSend, responseLog, columnName, conditional_clause, candidate)
                            conditional_clause = res.conditional_clause
                            if(!responseLog.includes(res.responseLog)) responseLog += res.responseLog
                        }
                        catch (err) {
                            console.log(err);
                        }
                    }
                    else {
                        const res = await executeActions(driver, flow, valueToSend, responseLog, columnName, conditional_clause, candidate)
                        if(!responseLog.includes(res.responseLog)) responseLog += res.responseLog
                        
                        conditional_clause = res.conditional_clause
                    }
                }
                conditional_clause = 0
            }
            else {
                if (action.conditional_field && action.conditional_field == 1) {
                    try {
                        const res = await executeActions(driver, action, valueToSend, responseLog, columnName, conditional_clause, candidate)
                        conditional_clause = res.conditional_clause
                        if(!responseLog.includes(res.responseLog)) responseLog += res.responseLog
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
                else {
                    const res = await executeActions(driver, action, valueToSend, responseLog, columnName, conditional_clause, candidate)
                    if(!responseLog.includes(res.responseLog)) responseLog += res.responseLog
                    conditional_clause = res.conditional_clause
                }
            }
        }

    } catch (err) {
        responseLog += err
        console.log(err);
    } finally {
        console.log('Completed Automation');
        try {
            const tableName = 'candidate';
            responseLog = responseLog.replace(/\n/g, ' ')
            console.log(responseLog);
            

            let updateQuery = `
                        UPDATE candidate
                        SET response = ?,lastRun = ?,isProcessing = ?
                        WHERE \`id\` = ?;
                    `;

            await connection.promise().query(updateQuery, [responseLog, currentDateTime(), 0, candidate.id]);
        } catch (err) {
            console.error('Error updating candidate:', err);
        }
        await driver.quit();
    }

}

const executeActions = async (driver, action, valueToSend, responseLog, columnName, conditional_clause, candidate) => {
    console.log(action);

    switch (action.actionName) {
        case 'sendKeys':
            if (valueToSend) {
                await driver.wait(until.elementLocated(By.xpath(`${action.portal_field}`)), 10000);
                await driver.findElement(By.xpath(`${action.portal_field}`)).sendKeys(valueToSend);
            } else {
                // responseLog += `No value found for action: ${action.value_field}\n`
                console.log(`No value found for sendKeys action: ${action.value_field}\n`);
            }
            break;
        case 'responseLog':
            try {
                let elementFound = await driver.wait(until.elementLocated(By.xpath(`${action.portal_field}`)), 10000);
                if (elementFound) {
                    responseLog += await driver.findElement(By.xpath(`${action.portal_field}`)).getText();
                }

            }
            catch (err) {

            }
            break;
        case 'getText':
            let located;
            try {
                located = await driver.wait(until.elementLocated(By.xpath(`${action.portal_field}`)), 10000);
                const text = await driver.findElement(By.xpath(`${action.portal_field}`)).getText();

                if (located && action.ifGot) conditional_clause = 1
                responseLog += `${text}\n`.toString()
            } catch (err) {
                if (action.ifGot) conditional_clause = 0
            }
            console.log("Conditional Clause ----- " + conditional_clause);

            break;
        case 'current':
            if (valueToSend) {
                let focusedElement = await driver.executeScript('return document.activeElement');
                await focusedElement.sendKeys(valueToSend);
            } else {
                responseLog += `No value found for action: ${action.value_field}\n`
                console.log(`No value found for current action: ${action.value_field}`);
            }
            break;
        case 'updateDB':
            if (valueToSend) {
                const tableName = 'candidate';

                const updateQuery = `
                            UPDATE ${tableName}
                            SET ${action.columnName} = ?
                            WHERE \`id\` = ?;
                        `;

                await connection.promise().query(updateQuery, [valueToSend, candidate.id]);
            }
            break;
        case 'getAndUpdateDB':
            await driver.wait(until.elementLocated(By.xpath(`${action.portal_field}`)), 10000);
            let data = await driver.findElement(By.xpath(`${action.portal_field}`)).getText();

            if (action.regex) {
                const regexString = action.regex;
                const regex = new RegExp(regexString);
                data = data.match(regex)[0]
            }

            try {
                const tableName = 'candidate';

                const updateQuery = `
                            UPDATE ${tableName}
                            SET ${columnName} = ?
                            WHERE \`id\` = ?;
                        `;

                await connection.promise().query(updateQuery, [data, candidate.id]);
            } catch (err) {
                console.error('Error updating candidate:', err);
            }
            break;
        case 'back':
            await driver.navigate().back();
            break;
        case 'refresh':
            await driver.navigate().refresh();
            break;
        case 'tab':
            await driver.wait(until.elementLocated(By.xpath(`${action.portal_field}`)), 10000);
            await driver.findElement(By.xpath(`${action.portal_field}`)).sendKeys(Key.TAB)
            break;
        case 'auto-type':
            const pathToValue = path.resolve(valueToSend)
            await automateTyping(pathToValue)
            break;
        case 'enter':
            await driver.findElement(By.xpath(`${action.portal_field}`)).sendKeys(Key.RETURN);
            break;
        case 'click':
            await driver.wait(until.elementLocated(By.xpath(`${action.portal_field}`)), 10000);
            await driver.findElement(By.xpath(`${action.portal_field}`)).click();
            break;
        case 'wait':
            await driver.sleep(parseInt(action.value_field));
            break;
        case 'scroll':
            const scrollAmount = parseInt(action.value_field) || 100;
            await driver.executeScript(`window.scrollBy(0, ${scrollAmount});`);
            break;
        case 'upload':
            const filePath = path.resolve(valueToSend)
            await driver.findElement(By.xpath(`${action.portal_field}`)).sendKeys(filePath);
            break;
        case 'custom':
            if (valueToSend) {
                await driver.wait(until.elementLocated(By.xpath(`${action.portal_field}`)), 10000);
                await driver.findElement(By.xpath(`${action.portal_field}`)).click();
                await driver.sleep(2000);
                await driver.wait(until.elementLocated(By.xpath(`//li[@role="option" and @aria-label="${valueToSend}"]`)), 10000);
                await driver.findElement(By.xpath(`//li[@role="option" and @aria-label="${valueToSend}"]`)).click();
                break;
            }
            break;
        case 'custom1':
            await driver.wait(until.elementLocated(By.xpath(`//div[@aria-label="${valueToSend}"]`)), 10000);
            await driver.findElement(By.xpath(`//div[@aria-label="${valueToSend}"]`)).click();
            break;
        case 'conditionalClick':
            await driver.sleep(5000);
            if ((valueToSend == '0'))
                await driver.findElement(By.xpath(`${action.portal_field}`)).click();
            break;
        case 'customDate1':
            await driver.findElement(By.xpath(`${action.portal_field}`)).click();
            const customDate = customDate1(valueToSend)
            await driver.findElement(By.xpath(`${action.portal_field}`)).sendKeys(customDate);
            await driver.sleep(2000);
            await driver.findElement(By.xpath(`${action.portal_field}`)).sendKeys(Key.TAB);
            await driver.executeScript(`window.scrollBy(0, 10);`);
            break;
        case 'updateStatus':
            let currentData = await getFromTable('candidate', 'id', candidate.id)
            currentData = currentData && currentData[0]
            const checkColumn = action.checkColumn

            if (currentData[checkColumn] !== action.checkField) {

                console.log(currentData[checkColumn]);

                const updateQuery = `
                UPDATE candidate
                SET ${action.changeColumn} = ?, submittedAt = ?
                WHERE \`id\` = ?;
            `;

                await connection.promise().query(updateQuery, [action.changeValue, currentDateTime(), candidate.id]);
            }
            else {
                const updateQuery = `
                UPDATE candidate
                SET ${action.changeColumn} = ?
                WHERE \`id\` = ?;
            `;
                await connection.promise().query(updateQuery, [action.negativeChangeValue, candidate.id]);
            }
            break;
        default:
            console.log(`Unknown action: ${action.actionName}`);
    }
    return { responseLog, conditional_clause }
}

module.exports = { automationController }