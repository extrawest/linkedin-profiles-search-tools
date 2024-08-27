import { parse } from 'csv-parse';
import * as fs from "fs";

export const parseDocument =  (path: string) => {
    const csvData: string[][]=[];
    return new Promise((resolve, reject) => {
      fs.createReadStream(path)
      .pipe(parse({delimiter: ','}))
      .on('data', function(csvrow: string[]) {
          csvData.push(csvrow);        
      })
      .on('end',function() {
        resolve(csvData)
      });
    })
  }