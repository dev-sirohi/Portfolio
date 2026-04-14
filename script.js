let pageData = {};

const FAKE_DELAY = 250;
const $NAVBAR = document.getElementsByClassName("navbar")[0];
const $MAIN_CONTENT = document.getElementsByClassName("main-content")[0];
const $INTRO = document.getElementsByClassName("intro")[0];
const $BASIC_INFO = document.getElementsByClassName("basic-info")[0];
const $NAME = document.getElementsByClassName("name")[0];
const $TAGLINE = document.getElementsByClassName("tagline")[0];
const $SOCIALS = document.getElementsByClassName("socials")[0];
const TEST_JSON = `{
  "OwnerInfo": {
    "FirstName": "",
    "LastName": "",
    "Tagline": "",
    "Socials": {
      "Instagram": "",
      "LinkedIn": "",
      "Github": "",
      "X": ""
    },
    "About": {
        "Name": "",
        "TabContentFormat": "",
        "TabContent": {
          "ProfilePic": true,
          "ProfilePicLink": ""
        }
    }
  },
  "Content": {
    "Tabs": [
      {
        "Name": "",
        "TabContentFormat": "",
        "TabContent": {
          "ContentList": [
            {
              "Name": "",
              "NameLink": "",
              "Description": "",
              "WriteUp": true,
              "WriteUpLink": ""
            }
          ]
        }
      }
    ]
  }
}`;

window.addEventListener("load", async function () {
    await fn_initPageAsync();
});

async function fn_initPageAsync() {
    try {
        await fn_fetchPageDataAsync();
        await fn_buildProfileAsync();
        await fn_buildTabsAsync();
        Utils.Events.mouseClick($NAVBAR.firstElementChild);
    }
    catch (e) {
        alert(e);
    }
}

async function fn_fetchPageDataAsync() {
    const db = JSON.parse(await (await fetch("./db.json")).text());
    fn_validateJson(db);
    pageData = {
        ...pageData,
        db: db,
    }
}

async function fn_buildProfileAsync() {
    const ownerInfo = pageData.db["OwnerInfo"];
    const firstName = ownerInfo["FirstName"];
    const lastName = ownerInfo["LastName"];
    const tagline = ownerInfo["Tagline"];
    const instagramLink = ownerInfo["Socials"]["Instagram"];
    const linkedInLink = ownerInfo["Socials"]["LinkedIn"];
    const githubLink = ownerInfo["Socials"]["Github"];
    const xLink = ownerInfo["Socials"]["X"];
    $NAME.textContent = firstName + " " + lastName;
    $TAGLINE.textContent = tagline;
    if (Utils.String.isNullOrEmpty(instagramLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.textContent = "Instagram";
        $SOCIALS.appendChild($socialElement);
    }
    if (Utils.String.isNullOrEmpty(linkedInLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.textContent = "LinkedIn";
        $SOCIALS.appendChild($socialElement);
    }
    if (Utils.String.isNullOrEmpty(githubLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.textContent = "Github";
        $SOCIALS.appendChild($socialElement);
    }
    if (Utils.String.isNullOrEmpty(xLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.textContent = "X (Twitter)";
        $SOCIALS.appendChild($socialElement);
    }
}

async function fn_buildTabsAsync() {
    for (let tab of pageData.db["Content"]["Tabs"]) {
        if (Utils.Object.isEmptyObject(tab) || Utils.String.isNullOrEmpty(tab["Name"])) {
            return;
        }
        const tabName = tab["Name"];
        const $tab = document.createElement("span");
        $tab.classList.add("navbar-item");
        $tab.dataset.elementId = await fn_generateElementIdFromTabIdAsync(tabName);
        const $tabInner = document.createElement("i");
        $tabInner.textContent = tabName;
        $tab.appendChild($tabInner);
        $tab.onclick = async function () {
            try {
                fn_emptyMainContentAsync();
                const elementId = this.getAttribute("data-element-id");
                await fn_loadMainContentByTabElementIdAsync(elementId);
            }
            catch (e) {
                fn_loadNoContentAsync();
                console.log(e);
            }
        }
        $NAVBAR.appendChild($tab);
    }

    // Append About tab in the last position
    const tab = pageData.db["OwnerInfo"]["About"];
    const tabName = tab["Name"];
    const $tab = document.createElement("span");
    $tab.classList.add("navbar-item");
    const $tabInner = document.createElement("i");
    $tabInner.textContent = tabName;
    $tab.appendChild($tabInner);
    $tab.onclick = async function () {
        try {
            fn_emptyMainContentAsync();
            await fn_loadContentFromContentFormat(tab["TabContent"], Utils.String.toStringSafe("About"));
        }
        catch (e) {
            fn_loadNoContentAsync();
            console.log(e);
        }
    }
    $NAVBAR.appendChild($tab);
}

async function fn_generateElementIdFromTabIdAsync(tabName = "") {
    let _tabName = "";
    if (!Utils.String.isNullOrEmpty(tabName)) {
        _tabName = tabName;
    }
    const msgUint8 = new TextEncoder().encode(_tabName);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function fn_loadMainContentByTabElementIdAsync(elementId = "") {
    let tabIndex = -1;
    for (let i = 0; i < pageData.db["Content"]["Tabs"].length; i++) {
        const x = pageData.db["Content"]["Tabs"][i];
        const _elementId = await fn_generateElementIdFromTabIdAsync(x["Name"]);

        if (Utils.String.isEqual(_elementId, elementId)) {
            tabIndex = i;
            break;
        }
    }
    if (tabIndex === -1) {
        throw new Error("Invalid tab index [fn_loadMainContentByTabElementId]" + Utils.String.toStringSafe(tabIndex));
    }
    fn_loadContentFromContentFormat(pageData.db["Content"]["Tabs"][tabIndex]["TabContent"], pageData.db["Content"]["Tabs"][tabIndex]["TabContentFormat"]);
}

function fn_loadContentFromContentFormat(content = {}, contentFormat = "") {
    if (Utils.Object.isEmptyObject(content) || Utils.String.isNullOrEmpty(contentFormat)) {
        throw new Error("Empty content [fn_loadContentFromContentFormat]: " + Utils.String.toStringSafe(content, contentFormat));
    }
    switch (Utils.String.toStringSafe(contentFormat)) {
        case Utils.String.toStringSafe("Grid"):
            fn_loadGridContentAsync(content);
            break;
        case Utils.String.toStringSafe("About"):
            fn_loadAboutContentAsync(content);
            break;
        default:
            throw new Error("Invalid content format [fn_loadContentFromContentFormat]: " + Utils.String.toStringSafe(contentFormat));
    }
}

async function fn_emptyMainContentAsync() {
    $MAIN_CONTENT.replaceChildren();
}

async function fn_loadNoContentAsync() {
    fn_emptyMainContentAsync();
    await Utils.Lang.setDelay(FAKE_DELAY);
    const $noContent = document.createElement("span");
    $noContent.classList.add("nocontent");
    $noContent.textContent = "No content available. (The developer is lazy...)";
    $MAIN_CONTENT.appendChild($noContent);
}

async function fn_loadGridContentAsync(content = {}) {
    fn_emptyMainContentAsync();
    await Utils.Lang.setDelay(FAKE_DELAY);
    if (Utils.Object.isEmptyObject(content)) {
        throw new Error("Invalid content [fn_getGridContent]");
    }
    var contentList = content["ContentList"];
    contentList.forEach(c => {
        const name = c["Name"];
        const nameLink = c["NameLink"];
        const description = c["Description"];
        const writeUp = "WriteUp";
        const writeUpLink = c["WriteUpLink"];

        /**
         * create content-block
         * create content-title - name
         * create content-desc - description
         * create writeup > link - writeup
         * add classes
         * add textContent
         * create element tree
         * attach to main-content
         */

        const $contentBlock = document.createElement("div");
        const $contentTitle = document.createElement("span");
        const $contentDesc = document.createElement("span");
        const $writeup = document.createElement("span");
        const $writeupLink = document.createElement("i");

        $contentBlock.classList.add("content-block");
        $contentTitle.classList.add("content-title");
        $contentDesc.classList.add("content-desc");
        $writeup.classList.add("writeup");
        $writeupLink.classList.add("writeup-link");

        $writeupLink.textContent = writeUp;
        $contentTitle.textContent = name;
        $contentDesc.textContent = description;

        $writeup.appendChild($writeupLink);

        $contentBlock.appendChild($contentTitle);
        $contentBlock.appendChild($contentDesc);
        $contentBlock.appendChild($writeup);

        $MAIN_CONTENT.appendChild($contentBlock);

        /**
         * Events
         */

        $writeupLink.onclick = function () {
            Utils.Api.execHref(writeUpLink);
        }
    });
}

async function fn_loadAboutContentAsync(content = {}) {
    fn_emptyMainContentAsync();
    await setTimeout(() => { }, FAKE_DELAY);
    if (Utils.Object.isEmptyObject(content)) {
        throw new Error("Invalid content [fn_loadAboutContent]" + Utils.String.toStringSafe(content));
    }
    const name = content["Name"];
    const intro = content["Intro"];
    fn_loadNoContentAsync(); // todo implement this
}

const Utils = {
    ["String"]: {
        isEqual: function (strA = "", strB = "", {
            IgnoreCase = false,
        } = {}) {
            let _strA = this.toStringSafe(strA).trim();
            let _strB = this.toStringSafe(strB).trim();
            if (IgnoreCase === true) {
                _strA = _strA.toLowerCase();
                _strB = _strB.toLowerCase();
            }
            return _strA === _strB;
        },
        isNullOrEmpty: function (str = "") {
            if (typeof str !== "string" && typeof str !== "null" && typeof str !== "undefined") {
                throw new Error("Invalid input (isNullOrEmpty): Expected [string]");
            }
            return (typeof str === "null" || typeof str === "undefined" || str.trim().length === 0);
        },
        toStringSafe: function (...args) {
            return args.map(s => {
                if (typeof s === "undefined") {
                    return "undefined";
                }
                if (typeof s === "null") {
                    return "null";
                }
                if (typeof s === "object") {
                    if (Array.isArray(s) && s.length === 0) {
                        return "[]";
                    }
                    return JSON.stringify(s);
                }
                return String(s);
            }).join(" | ");
        }
    },
    ["Object"]: {
        isEmptyObject: function (o) {
            let result = false;
            if (typeof o !== "object") {
                result = true;
            }
            if (Object.keys(o).every(x => (typeof x === "null" || typeof x === "undefined") || (typeof o[x] === "null" || typeof o[x] === "undefined"))) {
                result = true;
            }
            return result;
        },
        isObjectSchemaSame: function (objA = {}, objB = {}, validator = {}, depth = 0) {
            if (!(typeof objA === "object" && typeof objB === "object")) {
                throw new Error("Cannot check schema for non-object values");
            }
            if (depth > 10000) {
                throw new Error("Infinite recursion");
            }
            if (this.isEmptyObject(validator)) {
                if (isNaN(depth) || depth < 0) {
                    throw new Error("Invalid depth");
                }
                if (depth > 0) {
                    throw new Error("Invalid validator object at depth " + depth);
                }
                validator = {
                    Result: true,
                    TraceList: ["Base"],
                    Message: "Validated successfully",
                };
            }

            const objAKeyListSorted = Object.keys(objA).toSorted();
            const objBKeyListSorted = Object.keys(objB).toSorted();
            if (objAKeyListSorted.length !== objBKeyListSorted.length) {
                validator.Result = false;
                validator.Message = "Uneven key length";
                return validator;
            }
            const keyLength = objAKeyListSorted.length;
            for (let i = 0; i < keyLength; i++) {
                const objAKey = objAKeyListSorted[i];
                const objBKey = objBKeyListSorted[i];
                if (!Utils.String.isEqual(objAKey, objBKey)) {
                    validator.Result = false;
                    validator.Message = `Uneven key names: ${objAKey} <> ${objBKey}`;
                    return validator;
                }
            }
            for (let i = 0; i < keyLength; i++) {
                const objAKey = objAKeyListSorted[i];
                const objBKey = objBKeyListSorted[i];
                const objAValue = objA[objAKey];
                const objBValue = objB[objBKey];

                validator.TraceList.push(objAKey);

                if (typeof objAValue !== typeof objBValue) {
                    validator.Result = false;
                    validator.Message = `Uneven key value types: ${objAKey}(${typeof objAValue}) <> ${objBKey}(${typeof objBValue})}`;
                    return validator;
                }
                if (Array.isArray(objAValue)) {
                    function _arrayHelper(arrA, arrB, validator, depth = 0) {
                        if (!(Array.isArray(arrA) && Array.isArray(arrB))) {
                            throw new Error("Cannot check schema for non-array values during array validation");
                        }
                        if (depth > 10000) {
                            throw new Error("Infinite recursion");
                        }
                        if (Utils.Object.isEmptyObject(validator)) {
                            throw new Error("Invalid validator during array validation");
                        }

                        if (arrA.length === 0) {
                            // This means that this array's data is optional and can be of any type
                            return validator;
                        }
                        if (objBValue.length === 0) {
                            validator.Result = false;
                            validator.Message = `Empty array at required field: ${objAKey}(${typeof arrA}) <> ${objBKey}(${typeof arrB})}`;
                            return validator;
                        }
                        const firstArrayElementObjA = arrA[0];
                        const firstArrayElementObjB = arrB[0];
                        if (typeof firstArrayElementObjA !== typeof firstArrayElementObjB) {
                            validator.Result = false;
                            validator.Message = `Uneven key value types: ${firstArrayElementObjA}(${typeof firstArrayElementObjA}) <> ${firstArrayElementObjB}(${typeof firstArrayElementObjB})}`;
                            return validator;
                        }
                        if (!arrB.every(x => typeof x === typeof firstArrayElementObjA)) {
                            validator.Result = false;
                            validator.Message = `Uneven key value types for sibling elements: ${firstArrayElementObjA}(${typeof firstArrayElementObjA}) <> ${firstArrayElementObjB}(${typeof firstArrayElementObjB})}`;
                            return validator;
                        }
                        if (firstArrayElementObjA && Array.isArray(firstArrayElementObjA)) {
                            return _arrayHelper(firstArrayElementObjA, firstArrayElementObjB, validator, depth + 1);
                        }
                        return validator;
                    }
                    const newValidator = _arrayHelper(objAValue, objBValue, JSON.parse(JSON.stringify(validator)), 0);
                    if (this.isEmptyObject(newValidator)) {
                        validator.Result = false;
                        validator.Message = `Invalid validator returned during array recursion`;
                        return validator;
                    }
                    if (newValidator.Result === false) {
                        validator.Result = false;
                        validator.Message = newValidator.Message;
                        return validator;
                    }
                    continue;
                }
                if (typeof objAValue === "object") {
                    const newValidator = this.isObjectSchemaSame(objAValue, objBValue, JSON.parse(JSON.stringify(validator)), depth + 1);
                    if (this.isEmptyObject(newValidator)) {
                        validator.Result = false;
                        validator.Message = `Invalid validator returned during object recursion`;
                        return validator;
                    }
                    if (newValidator.Result === false) {
                        validator.Result = false;
                        validator.Message = newValidator.Message;
                        return validator;
                    }
                    continue;
                }
                validator.TraceList.pop();
            }
            return validator;
        }
    },
    ["Api"]: {
        execHref: function () {

        },
    },
    ["Events"]: {
        mouseClick: function ($element) {
            $element.dispatchEvent(new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
            }));
        }
    },
    ["Lang"]: {
        setDelay: function (timeout) {
            return new Promise(r => setTimeout(r, timeout));
        }
    }
}

function fn_validateJson(jsonData = {}) {
    const validationResult = Utils.Object.isObjectSchemaSame(jsonData, JSON.parse(TEST_JSON));
    if (Utils.Object.isEmptyObject(validationResult)) {
        throw new Error("Invalid JSON");
    }
    if (validationResult.Result === false) {
        throw new Error(validationResult.Message + " at " + validationResult.TraceList.join(" -> "));
    }
}