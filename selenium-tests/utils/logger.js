import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';

class Logger {
  constructor() {
    this.logDir = config.paths.logs;
    this.logFile = path.join(this.logDir, 'execution.log');
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Clear previous execution log on start
    fs.writeFileSync(this.logFile, `--- MedMonitor Selenium E2E Test Execution Logs [${new Date().toISOString()}] ---\n`);
  }

  _write(level, message) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level}] ${message}`;
    
    // Write to stdout
    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
    
    // Write to file
    fs.appendFileSync(this.logFile, formatted + '\n');
  }

  info(msg) {
    this._write('INFO', msg);
  }

  warn(msg) {
    this._write('WARN', msg);
  }

  error(msg, err) {
    let message = msg;
    if (err) {
      message += ` - ${err.message}\nStack: ${err.stack}`;
    }
    this._write('ERROR', message);
  }

  debug(msg) {
    this._write('DEBUG', msg);
  }
}

export const logger = new Logger();
