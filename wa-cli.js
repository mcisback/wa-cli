const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const { v6: uuid } = require('uuid');

const fs = require('fs');
const path = require('path');

const UserAgent = require('user-agents');

const { EventEmitter } = require('node:events');

class PageEventsEmitter extends EventEmitter {}

const { parseArgs } = require('node:util');

const args = process.argv;
const options = {
    newSession: {
        type: 'boolean',
        short: 'n',
        long: '-new-session'
    },
    loadSession: {
        type: 'string',
        short: 'l',
        long: '-load-session'
    },
    runCmd: {
        type: 'string',
        short: 'x',
    }
};
const {
    values,
} = parseArgs({ args, options, allowPositionals: true });

if(Object.keys(values).length <= 0) {
    console.log('Missing cmd newsession or load session');
    
    process.exit(1);
}

const {
    newSession,
    loadSession,
    runCmd
} = values;

const WA_URL = 'https://web.whatsapp.com'

const WABOT_CONFIG_FIR = path.join(require('os').homedir(), '/.wabot');

ensureDirectoryExists(WABOT_CONFIG_FIR);

const WABOT_QRCODE_DIR = WABOT_CONFIG_FIR + '/qrcodes';

ensureDirectoryExists(WABOT_QRCODE_DIR);

const pageEventsEmitter = new PageEventsEmitter();

if(newSession) {
    CHROME_SESSION_UUID = uuid();
    
    console.log(`Generating a new chrome session: ${CHROME_SESSION_UUID}`);
    
    const CHROME_SESSION_DIRECTORY = path.join(WABOT_CONFIG_FIR, `/${CHROME_SESSION_UUID}`);
    
    if (fs.existsSync(CHROME_SESSION_DIRECTORY)) {
        console.log('Session already exists; aborting it.');
        
        process.exit(1);
    }
    
    pageEventsEmitter.on('login-status', (status) => {
        console.log('Login Status Event: ', status);
        const {
            isLoggedIn
        } = status;
        
        if(!isLoggedIn) {
            console.log('Cannot login; exiting...');
            
            process.exit(1);
        }
        
        console.log('Logged In !');
        
        fs.writeFileSync(
            WABOT_CONFIG_FIR + `/chome-session-config-${CHROME_SESSION_UUID}.json`, 
            JSON.stringify({
                chromeSessionUuid: CHROME_SESSION_UUID,
                ...status,
            })
        );
    });
    
    (async () => {
        await waLogin(CHROME_SESSION_DIRECTORY);
    })()
    
}

if(loadSession && !runCmd) {
    CHROME_SESSION_UUID = loadSession
    console.log('Loading chrome session', loadSession);
    
    const CHROME_SESSION_DIRECTORY = path.join(WABOT_CONFIG_FIR, `/${CHROME_SESSION_UUID}`);
    
    if (!fs.existsSync(CHROME_SESSION_DIRECTORY)) {
        console.log('Session doesn\'t exists; retry login');
        
        process.exit(1);
    }
    
    (async () => {
        try {
            await openWa(CHROME_SESSION_DIRECTORY);
            //process.exit(0); // Move this here, or remove if you want the process to stay open
        } catch (error) {
            console.error('Error opening WA:', error);
            process.exit(1);
        }
    })();
}

if(loadSession && runCmd) {
    CHROME_SESSION_UUID = loadSession
    console.log('Loading chrome session', loadSession);
    
    const CHROME_SESSION_DIRECTORY = path.join(WABOT_CONFIG_FIR, `/${CHROME_SESSION_UUID}`);
    
    if (!fs.existsSync(CHROME_SESSION_DIRECTORY)) {
        console.log('Session doesn\'t exists; retry login');
        
        process.exit(1);
    }
    
    (async () => {
        try {
            await runWaCmd(CHROME_SESSION_DIRECTORY, runCmd);
            //process.exit(0); // Move this here, or remove if you want the process to stay open
        } catch (error) {
            console.error('Error opening WA:', error);
            process.exit(1);
        }
    })();
}


async function runWaCmd(userDataDir, cmd) {
    console.log('runWaCmd running command', cmd)

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir,
        timeout: 120000,
        defaultViewport: {
            width: 1280,
            height: 720
        },
        args: [
            // '--mute-audio', // this mutes the entire browser, not just one tab
            '--profile-directory=Default',
        ]
    });
    
    const page = await browser.newPage();
    
    // Navigate to mychat.com
    await page.goto(WA_URL, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('[data-icon="menu"]');

    // TODO: add scroll to bottom
    if(cmd === 'list-chats') {
        const chats = await page.evaluate(() => {
            const chats = [...document.querySelectorAll('div[role="listitem"]')].map(x => x.innerText.split('\n')[0].trim())

            return chats;
        });

        chats.forEach(chat => {
            console.log('· ' + chat)
        })

        return chats;
    }

    await browser.close();
}

async function openWa(userDataDir) {
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir,
        timeout: 120000,
        defaultViewport: {
            width: 1280,
            height: 720
        },
        args: [
            // '--mute-audio', // this mutes the entire browser, not just one tab
            '--profile-directory=Default',
        ]
    });
    
    const page = await browser.newPage();
    
    // Navigate to mychat.com
    await page.goto(WA_URL, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('[data-icon="menu"]');
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

async function waLogin(userDataDir) {
    console.log('Chrome userDataDir: ', userDataDir);
    
    const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();
    console.log('Using user agent: ', userAgent);
    
    // Launch the browser
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir,
        timeout: 120000,
        defaultViewport: {
            width: 1280,
            height: 720
        },
        args: [
            // '--mute-audio', // this mutes the entire browser, not just one tab
            '--profile-directory=Default',
        ]
    });
    
    const page = await browser.newPage();
    
    await page.setDefaultTimeout(120000);
    await page.setDefaultNavigationTimeout(120000);
    
    // Navigate to mychat.com
    await page.goto(WA_URL, { waitUntil: 'networkidle2' });
    
    // Wait for the element with the selector [data-ref] to load
    await page.waitForSelector('[data-ref]');
    
    // Get the inner HTML of the element
    const qrCodeToken = await page.evaluate(() => {
        const element = document.querySelector('[data-ref]');
        return element ? element.dataset.ref : null;
    });
    
    if(!qrCodeToken) {
        console.error('[!] Cannot retrieve qrcode');
        
        await browser.close();
    }
    
    //document.querySelector('[data-icon="menu"]')
    
    const qrCodePath = WABOT_QRCODE_DIR + `/qrcode-${CHROME_SESSION_UUID}.jpg`
    
    saveQRCodeToFile(qrCodeToken, qrCodePath);
    
    await page.waitForSelector('[data-icon="menu"]');
    
    const isLoggedIn = await page.evaluate(() => {
        const element = document.querySelector('[data-icon="menu"]');
        return !!element;
    });
    
    pageEventsEmitter.emit('login-status', {
        isLoggedIn,
        userAgent,
        qrCodeToken,
        qrCodePath
    });
    
    // await delay(60000);
    
    // return !!isLoggedIn;
}

async function saveQRCodeToFile(token, filePath) {
    console.log('saveQRCodeToFile to ', filePath);
    
    try {
        await QRCode.toFile(filePath, token, {
            type: 'jpeg',     // Specify JPEG format
            color: {
                dark: '#000000', // QR code color
                light: '#FFFFFF' // Background color
            }
        });
        console.log(`QR Code saved successfully to ${filePath}`);
    } catch (error) {
        console.error('Error saving QR code:', error);
    }
}

// Example usage


function ensureDirectoryExists(directoryPath) {
    // Check if the directory exists
    if (!fs.existsSync(directoryPath)) {
        // Create the directory
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log(`Directory created: ${directoryPath}`);
    } else {
        console.log(`Directory already exists: ${directoryPath}`);
    }
}
