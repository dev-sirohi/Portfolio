const pageData = {};

const _NavbarItem = document.getElementsByClassName("navbar-item");
const _MainContent = document.getElementsByClassName();

window.addEventListener("load", async function () {
    await fn_initPage();
    fn_setPageEvents();
});

async function fn_initPage() {
    await fn_fetchPageData();
}

async function fn_fetchPageData() {
    await fetch("./db.json")
        .then(async function (res) {
            const db = await res.text();
            pageData = {
                ...pageData,
                db: JSON.parse(db),
            }
        });
}

function fn_setPageEvents() {
    _NavbarItem.array.forEach(element => {
        document.onclick(element, function () {
            var elementId = element.getAttribute("data-element-id");
            fn_loadMainContentByTabElementId(elementId);
        });
    });
}

function fn_loadMainContentByTabElementId(elementId = "") {
    let tabIndex = pageData.db["Content"]["Tabs"].findIndex(x => Utils.String.isEqual(fn_generateElementIdFromTabName(x["Name"]), elementId));
    if (tabIndex === -1) {
        return fn_getNoContent();
    }
    let content = "";
    try {
        content = fn_getContentFromContentFormat(pageData.db["Content"]["Tabs"][tabIndex], pageData.db["Content"]["Tabs"][tabIndex]["TabContentFormat"]);
    } catch (e) {
        content = fn_getNoContent();
        console.log(e);
    }
    return content;
}

function fn_generateElementIdFromTabName(tabName = "") {

}

function fn_getContentFromContentFormat(content = {}, contentFormat = "") {
    if (Utils.Object.isEmptyObject(content) || Utils.String.isNullOrEmpty(contentFormat)) {
        return fn_getNoContent();
    }
    switch (contentFormat) {
        case "Grid":
            return fn_getGridContent(content);
        case "About":
            return fn_getAboutContent(content);
        default:
            return fn_getNoContent();
    }
}

function fn_getNoContent() {
    return "No content";
}

function fn_getGridContent(content = {}) {
    if (Utils.Object.isEmptyObject(content) || Utils.String.isNullOrEmpty(contentFormat)) {
        return fn_getNoContent();
    }
    let gridContent = "";
    var contentList = content["ContentList"];
    contentList.forEach(c => {
        const name = c["Name"];
        const nameLink = c["NameLink"];
        const description = c["Description"];
        const writeUp = c["WriteUp"];
        const writeUpLink = c["WriteUpLink"];


    });
    return gridContent;
}

function fn_getAboutContent(content = {}) {
    if (Utils.Object.isEmptyObject(content) || Utils.String.isNullOrEmpty(contentFormat)) {
        return fn_getNoContent();
    }
    let aboutContent = "";
    return aboutContent;
}

const Utils = {
    ["ObjectRecursionDepthCounter"]: 0,
    ["String"]: {
        isEqual: function (strA = "", strB = "", {
            IgnoreCase = false,
        } = {}) {
            if (![strA, strB].every(x => typeof x === "string")) {
                throw new Error("Invalid input: Expected [string]");
            }
            let _strA = strA.trim();
            let _strB = strB.trim();
            if (IgnoreCase === true) {
                _strA = _strA.toLowerCase();
                _strB = _strB.toLowerCase();
            }
            return _strA === _strB;
        },
        isNullOrEmpty: function (str = "") {
            if (typeof str !== "string" || typeof str !== "null" || typeof str !== "undefined") {
                throw new Error("Invalid input: Expected [string]");
            }
            return (typeof str === "null" || typeof str === "undefined" || str.trim().length === 0);
        },
    },
    ["Object"]: {
        isEmptyObject: function (o) {
            if (this.ObjectRecursionDepthCounter > 50) {
                throw new Error("[Infinite recursion]");
            }
            this.ObjectRecursionDepthCounter++;
            let result = false;
            if (typeof o !== "object") {
                result = true;
            }
            if (Object.keys(o).every(x => (typeof x === "null" || typeof x === "undefined") || (typeof o[x] === "null" || typeof o[x] === "undefined"))) {
                result = true;
            }
            result = Object.keys(o).filter(x => typeof o[x] === "object" && !Array.isArray(o[x])).every(x => this.isEmptyObject(o[x]));
            this.ObjectRecursionDepthCounter--;
            return result;
        },
    }
}

