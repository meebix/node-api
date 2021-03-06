import pino from 'pino';
import config from 'config';
import path from 'path';
import uuid from 'uuid/v4';

let destination = path.join(process.cwd(), 'logs/app.log');

if (process.env.NODE_ENV !== 'production') {
  destination = pino.destination(1);
}

/**
 * Creates a default logger instance
 *
 * @returns {Function} - Pino logger instance
 */
const defaultLogger = pino(
  {
    name: 'node-graphql',
    level: config.get('logger.level'),
    enable: config.get('logger.enabled'),
    redact: {
      paths: [],
      remove: true,
    },
    prettyPrint: config.get('logger.pretty'),
  },
  destination
);

/**
 * Creates a child instance of the default logger
 *
 * @returns {Function} - Pino child logger instance
 */
const logger = defaultLogger.child({
  serializers: {
    req: req => {
      if (!req) {
        return false;
      }

      const whitelistedHeaders = () => {
        const headers = Object.assign({}, req.headers);
        delete headers.authorization;
        return headers;
      };

      return {
        id: uuid(),
        query: req.query,
        params: req.params,
        method: req.method,
        url: req.url,
        body: req.body,
        headers: whitelistedHeaders(),
        httpVersion: req.httpVersion,
        ip: req.ip,
      };
    },
    res: res => {
      if (!res) {
        return false;
      }

      return {
        statusCode: res.statusCode,
        headers: res._headers,
      };
    },
    args: args => {
      const whitelistArgs = Object.assign({}, { ...args.input });

      delete whitelistArgs.firstName;
      delete whitelistArgs.lastName;
      delete whitelistArgs.email;
      delete whitelistArgs.password;
      delete whitelistArgs.answers;

      return { ...whitelistArgs };
    },
  },
});

export default logger;
