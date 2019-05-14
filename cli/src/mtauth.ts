import * as fs from 'fs';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http';
import * as os from 'os';
import * as path from 'path';

// const store = {
//    tokenExpirationTimestamp: new Date(),
//    tokenIONAPI: '',
//    mneCookies: '',
//    validCookies: false,
// };

// function checkIONAPIAuthentication(proxyResponse: IncomingMessage, incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
//    const authResponse = proxyResponse.headers['www-authenticate'];
//    if (authResponse && authResponse.includes('error')) {
//       console.log('ION API authentication failed ' + authResponse);
//       // Force update of reading tokenfile
//       store.tokenExpirationTimestamp = new Date();
//       return false;
//    }
//    return true;
// }

// function readAuthHeaderFile() {
//    const projectRoot = process.cwd();
//    const filePath = path.resolve(projectRoot, 'authorizationheader.json');
//    try {
//       return fs.readJsonSync(filePath);
//    } catch (error) {
//       console.log('The ION API Token file not found. ' + error);
//       return undefined;
//    }
// }

// function setIONAPIToken(clientRequest: ClientRequest, incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
//    if (new Date() >= store.tokenExpirationTimestamp) {
//       console.log('Authorization header file must be read.');
//       const json = readAuthHeaderFile();
//       if (json) {
//          try {
//             store.tokenIONAPI = json.authorizationHeader;
//             store.tokenExpirationTimestamp = new Date(json.expirationTimestamp);
//             console.log('Header = ' + store.tokenIONAPI);
//             console.log('Expires = ' + store.tokenExpirationTimestamp);
//          } catch (error) {
//             console.log('Failed to access the ION API Token . ' + error);
//          }
//       } else {
//          console.log('The ION API Token is missing.');
//       }
//    }
//    try {
//       clientRequest.setHeader('Authorization', store.tokenIONAPI);
//    } catch (error) {
//       console.log('Failed to set the ION API Token to the Authorization header. ' + error);
//    }
// }

// function readCookieHeaderFile() {
//    const projectRoot = process.cwd();
//    const filePath = path.resolve(projectRoot, 'cookieheader.json');
//    console.log('readCookieHeader: filepath: ' + filePath);
//    try {
//       return fs.readFileSync(filePath).toString();
//    } catch (error) {
//       console.log('The ION API Token file not found. ' + error);
//       return undefined;
//    }
// }

// function setMNECookies(clientRequest: ClientRequest, incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
//    if (!store.validCookies) {
//       console.log('Cookie header file must be read.');
//       const cookieString = readCookieHeaderFile();
//       console.log('Cookie = ' + cookieString);
//       if (cookieString) {
//          store.mneCookies = cookieString;
//          store.validCookies = true;
//       }
//    }

//    try {
//       clientRequest.setHeader('cookie', store.mneCookies);
//    } catch (error) {
//       console.log('Failed to set the cookies to the Cookie header. ' + error);
//       store.mneCookies = '';
//       store.validCookies = false;
//    }
// }

// function onError(src: string, err: Error, response: ServerResponse) {
//    console.log('onError ' + src + ' ' + new Date().toTimeString());
//    console.log(err);
// }

/**
 * Methods of this interface will be called by untyped JS. Be very careful when changing this interface, as TypeScript may not be aware of
 * the usage.
 */
interface Authenticator {
   /**
    * placeholder: ODIN_MT_SET_MNE_COOKIES
    */
   setMNECookies(clientRequest: ClientRequest, incomingMessage: IncomingMessage, serverResponse: ServerResponse): void;

   /**
    * placeholder: ODIN_MT_SET_ION_API_TOKEN
    */
   setIONAPIToken(clientRequest: ClientRequest, incomingMessage: IncomingMessage, serverResponse: ServerResponse): void;

   /**
    * placeholder: ODIN_MT_CHECK_ION_API_AUTHENTICATION
    */
   checkIONAPIAuthentication(proxyResponse: IncomingMessage, incomingMessage: IncomingMessage, serverResponse: ServerResponse): boolean;

   /**
    * placeholder: ODIN_MT_ON_ERROR
    */
   onError(src: string, err: Error, response: ServerResponse): void;
}

class MultiTenantAuthenticator implements Authenticator {
   tokenExpirationTimestamp = new Date();
   tokenIONAPI = '';
   mneCookies = '';
   validCookies = false;

   private projectRoot = os.tmpdir();

   setMNECookies(clientRequest: ClientRequest, incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
      if (!this.validCookies) {
         console.log('Cookie header file must be read.');
         const cookieString = this.readCookieHeaderFile();
         console.log('Cookie = ' + cookieString);
         if (cookieString) {
            this.mneCookies = cookieString;
            this.validCookies = true;
         }
      }

      try {
         clientRequest.setHeader('cookie', this.mneCookies);
      } catch (error) {
         console.log('Failed to set the cookies to the Cookie header. ' + error);
         this.mneCookies = '';
         this.validCookies = false;
      }
   }

   setIONAPIToken(clientRequest: ClientRequest, incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
      if (new Date() >= this.tokenExpirationTimestamp) {
         console.log('Authorization header file must be read.');
         const json = this.readAuthHeaderFile();
         if (json) {
            try {
               this.tokenIONAPI = json.authorizationHeader;
               this.tokenExpirationTimestamp = new Date(json.expirationTimestamp);
               console.log('Header = ' + this.tokenIONAPI);
               console.log('Expires = ' + this.tokenExpirationTimestamp);
            } catch (error) {
               console.log('Failed to access the ION API Token . ' + error);
            }
         } else {
            console.log('The ION API Token is missing.');
         }
      }
      try {
         clientRequest.setHeader('Authorization', this.tokenIONAPI);
      } catch (error) {
         console.log('Failed to set the ION API Token to the Authorization header. ' + error);
      }
   }

   checkIONAPIAuthentication(proxyResponse: IncomingMessage, incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
      const authResponse = proxyResponse.headers['www-authenticate'];
      if (authResponse && authResponse.includes('error')) {
         console.log('ION API authentication failed ' + authResponse);
         // Force update of reading tokenfile
         this.tokenExpirationTimestamp = new Date();
         return false;
      }
      return true;
   }

   onError(src: string, err: Error, response: ServerResponse) {
      console.log('onError ' + src + ' ' + new Date().toTimeString());
      console.log(err);
   }

   private readCookieHeaderFile() {
      const filePath = path.resolve(this.projectRoot, 'cookieheader.json');
      console.log('readCookieHeader: filepath: ' + filePath);
      try {
         return fs.readFileSync(filePath).toString();
      } catch (error) {
         console.log('The ION API Token file not found. ' + error);
         return undefined;
      }
   }

   private readAuthHeaderFile() {
      const filePath = path.resolve(this.projectRoot, 'authorizationheader.json');
      try {
         return this.readJsonFile(filePath);
      } catch (error) {
         console.log('The ION API Token file not found. ' + error);
         return undefined;
      }
   }

   private readJsonFile(filePath: string) {
      return JSON.parse(stripBom(fs.readFileSync(filePath)));

      function stripBom(content: Buffer | string) {
         if (Buffer.isBuffer(content)) {
            content = content.toString('utf8');
         }
         content = content.replace(/^\uFEFF/, '');
         return content;
      }
   }
}

const authenticator = new MultiTenantAuthenticator();

// @ts-ignore
module.exports = CONFIG_PLACEHOLDER;
