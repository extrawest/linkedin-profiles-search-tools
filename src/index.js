"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var csv_parse_1 = require("csv-parse");
require("dotenv/config");
var google_custom_search_1 = require("@langchain/community/tools/google_custom_search");
var prompts_1 = require("@langchain/core/prompts");
var openai_1 = require("@langchain/openai");
var getGoogleResults = function (input, link) { return __awaiter(void 0, void 0, void 0, function () {
    var links, search, request, results, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                links = {
                    linkedinLinks: [],
                    name: input,
                    link: link
                };
                search = new google_custom_search_1.GoogleCustomSearch({
                    apiKey: process.env.GOOGLE_API_KEY,
                    googleCSEId: process.env.GOOGLE_CSE_ID,
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, search.invoke("".concat(input, " linkedin.com profile"))];
            case 2:
                request = _a.sent();
                results = JSON.parse(request);
                links.linkedinLinks = results.map(function (result) { return result.link; });
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.error('Custom search error', e_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/, links];
        }
    });
}); };
var parseDocument = function (path) {
    var csvData = [];
    return new Promise(function (resolve, reject) {
        fs.createReadStream(path)
            .pipe((0, csv_parse_1.parse)({ delimiter: ',' }))
            .on('data', function (csvrow) {
            csvData.push(csvrow);
        })
            .on('end', function () {
            resolve(csvData);
        });
    });
};
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var csvData, requiredData, data, model, prompt, chain, resultLinks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, parseDocument('./data/companies_kv.csv')];
            case 1:
                csvData = _a.sent();
                console.log('csvData', csvData[0], csvData[1]);
                requiredData = [];
                if (Array.isArray(csvData) && csvData[0][0] === 'name' && csvData[0][1] === 'link') {
                    requiredData.push.apply(requiredData, csvData.slice(1, 5)); //TODO: delte 5
                }
                else {
                    throw new Error('Wrong document format');
                }
                return [4 /*yield*/, Promise.all(requiredData.map(function (row) {
                        return new Promise(function (resolve, reject) {
                            if (row[0] && row[1]) {
                                resolve(getGoogleResults(row[0], row[1]));
                            }
                            else {
                                reject('Data has format issue');
                            }
                        });
                    }))];
            case 2:
                data = _a.sent();
                console.log('data', data[0]);
                model = new openai_1.ChatOpenAI({
                    model: "gpt-3.5-turbo",
                    openAIApiKey: process.env.OPENAI_API_KEY,
                });
                prompt = prompts_1.ChatPromptTemplate.fromMessages([
                    ["system", "You are a helpful AI assistant. You will be given a company name and a list of LinkedIn links. Your task is to choose the one link that most accurately represents the profile of the given company. Usually correct link contains string 'company'. Analyze the given text and return the result in JSON format with the following key: 'linkedinLink'."],
                    ["human", "Company name is {name}. List of links: {links}"],
                ]);
                chain = prompt.pipe(model);
                return [4 /*yield*/, Promise.all(data.map(function (company) {
                        return new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                            var res, linkedinLink;
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0: return [4 /*yield*/, chain.invoke({
                                            name: company.name,
                                            links: company.linkedinLinks
                                        })];
                                    case 1:
                                        res = _d.sent();
                                        linkedinLink = (_c = (_b = JSON.parse((_a = res === null || res === void 0 ? void 0 : res.content) !== null && _a !== void 0 ? _a : '')) === null || _b === void 0 ? void 0 : _b.linkedinLink) === null || _c === void 0 ? void 0 : _c.trim();
                                        resolve({
                                            name: company.name,
                                            link: company.link,
                                            linkedinLink: linkedinLink !== null && linkedinLink !== void 0 ? linkedinLink : 'not found'
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    }))];
            case 3:
                resultLinks = _a.sent();
                console.log(resultLinks);
                return [2 /*return*/];
        }
    });
}); };
main();
