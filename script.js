let pageData = {};

const FAKE_DELAY = 125;
const $NAVBAR = document.getElementsByClassName("navbar")[0];
const $MAIN_CONTENT = document.getElementsByClassName("main-content")[0];
const $INTRO = document.getElementsByClassName("intro")[0];
const $BASIC_INFO = document.getElementsByClassName("basic-info")[0];
const $NAME = document.getElementsByClassName("name")[0];
const $PHONE_NUMBER = document.getElementsByClassName("phone-number")[0];
const $TAGLINE = document.getElementsByClassName("tagline")[0];
const $SOCIALS = document.getElementsByClassName("socials")[0];

window.addEventListener("load", async function () {
    await fn_initPageAsync();
});

async function fn_initPageAsync() {
    try {
        await fn_fetchPageDataAsync();
        await fn_buildProfileAsync();
        if (fn_isMobileView()) {
            await fn_buildMobileViewAsync();
        } else {
            await fn_buildTabsAsync();
            Utils.Events.mouseClick($NAVBAR.firstElementChild);
        }
    } catch (e) {
        alert(e);
    }
}

async function fn_fetchPageDataAsync() {
    const db = JSON.parse(await (await fetch("./db.json")).text());
    fn_validateJson(db);
    pageData = {
        ...pageData,
        db: db,
    };
}

async function fn_buildProfileAsync() {
    const ownerInfo = pageData.db["OwnerInfo"];
    const firstName = ownerInfo["FirstName"];
    const lastName = ownerInfo["LastName"];
    const phNumber = ownerInfo["PhoneNumber"];
    const tagline = ownerInfo["Tagline"];
    const instagramLink = ownerInfo["Socials"]["Instagram"];
    const linkedInLink = ownerInfo["Socials"]["LinkedIn"];
    const githubLink = ownerInfo["Socials"]["Github"];
    const xLink = ownerInfo["Socials"]["X"];
    $NAME.innerHTML = firstName + " " + lastName;
    $TAGLINE.innerHTML = tagline;
    // $PHONE_NUMBER.innerHTML = phNumber;
    if (!Utils.String.isNullOrEmpty(instagramLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.innerHTML = "Instagram" + fn_getRedirectSvg();
        $socialElement.classList.add("social-element");
        $socialElement.classList.add("link");
        $socialElement.onclick = async function () {
            Utils.Api.openInNewWindow(instagramLink);
        };
        $SOCIALS.appendChild($socialElement);
    }
    if (!Utils.String.isNullOrEmpty(linkedInLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.innerHTML = "LinkedIn" + fn_getRedirectSvg();
        $socialElement.classList.add("social-element");
        $socialElement.classList.add("link");
        $socialElement.onclick = async function () {
            Utils.Api.openInNewWindow(linkedInLink);
        };
        $SOCIALS.appendChild($socialElement);
    }
    if (!Utils.String.isNullOrEmpty(githubLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.innerHTML = "Github" + fn_getRedirectSvg();
        $socialElement.classList.add("social-element");
        $socialElement.classList.add("link");
        $socialElement.onclick = async function () {
            Utils.Api.openInNewWindow(githubLink);
        };
        $SOCIALS.appendChild($socialElement);
    }
    if (!Utils.String.isNullOrEmpty(xLink)) {
        const $socialElement = document.createElement("span");
        $socialElement.innerHTML = "X (Twitter)" + fn_getRedirectSvg();
        $socialElement.classList.add("social-element");
        $socialElement.classList.add("link");
        $socialElement.onclick = async function () {
            Utils.Api.openInNewWindow(xLink);
        };
        $SOCIALS.appendChild($socialElement);
    }
}

async function fn_buildMobileViewAsync() {
    await fn_emptyMainContentAsync();

    let $divider = document.createElement("hr");
    $divider.classList.add("divider");
    $MAIN_CONTENT.appendChild($divider);

    const tabs = pageData.db["Content"]["Tabs"];

    for (let tab of tabs) {
        const $title = document.createElement("h2");
        $title.innerText = tab["Name"];
        $MAIN_CONTENT.appendChild($title);

        await fn_loadContentFromContentFormatAsync(
            tab["TabContent"],
            tab["TabContentFormat"],
        );

        $divider = document.createElement("hr");
        $divider.classList.add("divider");
        $MAIN_CONTENT.appendChild($divider);
    }

    // About at last
    const about = pageData.db["OwnerInfo"]["About"];

    // const $title = document.createElement("h2");
    // $title.innerText = about["Name"];
    // $MAIN_CONTENT.appendChild($title);

    await fn_loadContentFromContentFormatAsync(
        about["TabContent"],
        about["TabContentFormat"],
    );
}

async function fn_buildTabsAsync() {
    for (let tab of pageData.db["Content"]["Tabs"]) {
        if (
            Utils.Object.isEmptyObject(tab) ||
            Utils.String.isNullOrEmpty(tab["Name"])
        ) {
            return;
        }
        const tabName = tab["Name"];
        const $tab = document.createElement("span");
        $tab.classList.add("navbar-item");
        $tab.dataset.elementId =
            await fn_generateElementIdFromTabIdAsync(tabName);
        const $tabInner = document.createElement("span");
        $tabInner.innerHTML = tabName;
        $tabInner.classList.add("navbar-item-inner");
        $tab.appendChild($tabInner);
        $tab.onclick = async function () {
            try {
                fn_emptyMainContentAsync();
                const elementId = this.getAttribute("data-element-id");
                await fn_loadMainContentByTabElementIdAsync(elementId);
                this.classList.add("active");
            } catch (e) {
                fn_loadNoContentAsync();
                console.log(e);
            }
        };
        $NAVBAR.appendChild($tab);
    }

    // Append About tab in the last position
    const tab = pageData.db["OwnerInfo"]["About"];
    const tabName = tab["Name"];
    const $tab = document.createElement("span");
    $tab.classList.add("navbar-item");
    const $tabInner = document.createElement("span");
    $tabInner.classList.add("navbar-item-inner");
    $tabInner.innerHTML = tabName;
    $tab.appendChild($tabInner);
    $tab.onclick = async function () {
        try {
            fn_emptyMainContentAsync();
            await fn_loadContentFromContentFormatAsync(
                tab["TabContent"],
                Utils.String.toStringSafe("About"),
            );
            this.classList.add("active");
        } catch (e) {
            fn_loadNoContentAsync();
            console.log(e);
        }
    };
    $NAVBAR.appendChild($tab);
}

async function fn_generateElementIdFromTabIdAsync(tabName = "") {
    let _tabName = "";
    if (!Utils.String.isNullOrEmpty(tabName)) {
        _tabName = tabName;
    }
    const msgUint8 = new TextEncoder().encode(_tabName);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
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
        throw new Error(
            "Invalid tab index [fn_loadMainContentByTabElementId]" +
                Utils.String.toStringSafe(tabIndex),
        );
    }
    await fn_loadContentFromContentFormatAsync(
        pageData.db["Content"]["Tabs"][tabIndex]["TabContent"],
        pageData.db["Content"]["Tabs"][tabIndex]["TabContentFormat"],
    );
}

async function fn_loadContentFromContentFormatAsync(
    content = {},
    contentFormat = "",
) {
    if (
        Utils.Object.isEmptyObject(content) ||
        Utils.String.isNullOrEmpty(contentFormat)
    ) {
        throw new Error(
            "Empty content [fn_loadContentFromContentFormat]: " +
                Utils.String.toStringSafe(content, contentFormat),
        );
    }
    switch (Utils.String.toStringSafe(contentFormat)) {
        case Utils.String.toStringSafe("Grid"):
            await fn_loadGridContentAsync(content);
            break;
        case Utils.String.toStringSafe("About"):
            await fn_loadAboutContentAsync(content);
            break;
        default:
            throw new Error(
                "Invalid content format [fn_loadContentFromContentFormat]: " +
                    Utils.String.toStringSafe(contentFormat),
            );
    }
}

async function fn_emptyMainContentAsync() {
    $MAIN_CONTENT.replaceChildren();
    Array.from($NAVBAR.children).forEach((element) =>
        element.classList.remove("active"),
    );
}

async function fn_loadNoContentAsync() {
    fn_emptyMainContentAsync();
    await Utils.Lang.setDelay(FAKE_DELAY);
    const $noContent = document.createElement("span");
    $noContent.classList.add("nocontent");
    $noContent.innerHTML = "No content available. (The developer is lazy...)";
    $MAIN_CONTENT.appendChild($noContent);
}

async function fn_loadGridContentAsync(content = {}) {
    // fn_emptyMainContentAsync();
    await Utils.Lang.setDelay(FAKE_DELAY);
    if (Utils.Object.isEmptyObject(content)) {
        throw new Error("Invalid content [fn_getGridContent]");
    }
    var contentList = content["ContentList"];
    contentList.forEach((c) => {
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
         * add innerHTML
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
        $contentTitle.classList.add("link");
        $contentDesc.classList.add("content-desc");
        $writeup.classList.add("writeup");
        $writeupLink.classList.add("writeup-link");
        $writeupLink.classList.add("link");

        $writeupLink.innerHTML = writeUp + fn_getRedirectSvg();
        $contentTitle.innerHTML = name + fn_getRedirectSvg();
        $contentDesc.innerHTML = description;

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
        };
    });
}

async function fn_loadAboutContentAsync(content = {}) {
    await Utils.Lang.setDelay(FAKE_DELAY);

    if (Utils.Object.isEmptyObject(content)) {
        throw new Error(
            "Invalid content [fn_loadAboutContent]" +
                Utils.String.toStringSafe(content),
        );
    }

    const showPic = content["ProfilePic"];
    const picLink = content["ProfilePicLink"];
    const exp = content["ProfessionalExperience"] || [];
    const edu = content["Education"] || [];
    const tech = content["TechStack"] || [];

    const $container = document.createElement("div");
    $container.classList.add("about-root");

    const $header = document.createElement("div");
    $header.classList.add("about-header");

    if (showPic && picLink) {
        const $img = document.createElement("img");
        $img.src = picLink;
        $img.classList.add("about-pic");
        $header.appendChild($img);
    }

    // const $name = document.createElement("h2");
    // $name.innerText = "Dev Sirohi";
    // $name.classList.add("about-name");

    // const $desc = document.createElement("p");
    // $desc.classList.add("about-desc");
    // $desc.innerHTML = `
    //     Software engineer building backend-heavy systems.<br>
    //     Focused on performance, networking, and low-level design.
    // `;

    // $header.appendChild($name);
    // $header.appendChild($desc);
    $container.appendChild($header);

    if (exp.length) {
        const $section = document.createElement("div");
        $section.classList.add("about-section");

        const $title = document.createElement("h3");
        $title.innerText = "Experience";
        $section.appendChild($title);

        exp.forEach((e) => {
            const $item = document.createElement("div");
            $item.classList.add("about-item");

            const $top = document.createElement("div");
            $top.classList.add("about-item-top");
            $top.innerHTML = `<b>${e.CompanyName}</b> — ${e.JobType}`;

            const $meta = document.createElement("div");
            $meta.classList.add("about-meta");
            $meta.innerText = `${e.JoinDate} - ${e.IsCurrentJob ? "Present" : e.EndDate}`;

            const $desc = document.createElement("div");
            $desc.classList.add("about-item-desc");
            $desc.innerText = e.Description;

            $item.appendChild($top);
            $item.appendChild($meta);
            $item.appendChild($desc);

            $section.appendChild($item);
        });

        $container.appendChild($section);
    }

    if (edu.length) {
        const $section = document.createElement("div");
        $section.classList.add("about-section");

        const $title = document.createElement("h3");
        $title.innerText = "Education";
        $section.appendChild($title);

        edu.forEach((e) => {
            const $item = document.createElement("div");
            $item.classList.add("about-item");

            $item.innerHTML = `
                <b>${e.Course}</b><br>
                ${e.Institution}<br>
                ${e.StartDate} - ${e.IsOngoing ? "Present" : e.EndDate}
            `;

            $section.appendChild($item);
        });

        $container.appendChild($section);
    }

    if (tech.length) {
        const $section = document.createElement("div");
        $section.classList.add("about-section");

        const $title = document.createElement("h3");
        $title.innerText = "Tech Stack";
        $section.appendChild($title);

        const $grid = document.createElement("div");
        $grid.classList.add("tech-grid");

        tech.forEach((t) => {
            const $chip = document.createElement("span");
            $chip.classList.add("tech-chip");
            $chip.innerText = t;
            $grid.appendChild($chip);
        });

        $section.appendChild($grid);
        $container.appendChild($section);
    }

    $MAIN_CONTENT.appendChild($container);
}

const Utils = {
    ["String"]: {
        isEqual: function (strA = "", strB = "", { IgnoreCase = false } = {}) {
            let _strA = this.toStringSafe(strA).trim();
            let _strB = this.toStringSafe(strB).trim();
            if (IgnoreCase === true) {
                _strA = _strA.toLowerCase();
                _strB = _strB.toLowerCase();
            }
            return _strA === _strB;
        },
        isNullOrEmpty: function (str = "") {
            if (
                typeof str !== "string" &&
                typeof str !== "null" &&
                typeof str !== "undefined"
            ) {
                throw new Error(
                    "Invalid input (isNullOrEmpty): Expected [string]",
                );
            }
            return (
                typeof str === "null" ||
                typeof str === "undefined" ||
                str.trim().length === 0
            );
        },
        toStringSafe: function (...args) {
            return args
                .map((s) => {
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
                })
                .join(" | ");
        },
    },
    ["Object"]: {
        isEmptyObject: function (o) {
            let result = false;
            if (typeof o !== "object") {
                result = true;
            }
            if (
                Object.keys(o).every(
                    (x) =>
                        typeof x === "null" ||
                        typeof x === "undefined" ||
                        typeof o[x] === "null" ||
                        typeof o[x] === "undefined",
                )
            ) {
                result = true;
            }
            return result;
        },
        isObjectSchemaSame: function (
            objA = {},
            objB = {},
            validator = {},
            depth = 0,
        ) {
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
                    throw new Error(
                        "Invalid validator object at depth " + depth,
                    );
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
                            throw new Error(
                                "Cannot check schema for non-array values during array validation",
                            );
                        }
                        if (depth > 10000) {
                            throw new Error("Infinite recursion");
                        }
                        if (Utils.Object.isEmptyObject(validator)) {
                            throw new Error(
                                "Invalid validator during array validation",
                            );
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
                        if (
                            typeof firstArrayElementObjA !==
                            typeof firstArrayElementObjB
                        ) {
                            validator.Result = false;
                            validator.Message = `Uneven key value types: ${firstArrayElementObjA}(${typeof firstArrayElementObjA}) <> ${firstArrayElementObjB}(${typeof firstArrayElementObjB})}`;
                            return validator;
                        }
                        if (
                            !arrB.every(
                                (x) =>
                                    typeof x === typeof firstArrayElementObjA,
                            )
                        ) {
                            validator.Result = false;
                            validator.Message = `Uneven key value types for sibling elements: ${firstArrayElementObjA}(${typeof firstArrayElementObjA}) <> ${firstArrayElementObjB}(${typeof firstArrayElementObjB})}`;
                            return validator;
                        }
                        if (
                            firstArrayElementObjA &&
                            Array.isArray(firstArrayElementObjA)
                        ) {
                            return _arrayHelper(
                                firstArrayElementObjA,
                                firstArrayElementObjB,
                                validator,
                                depth + 1,
                            );
                        }
                        return validator;
                    }
                    const newValidator = _arrayHelper(
                        objAValue,
                        objBValue,
                        JSON.parse(JSON.stringify(validator)),
                        0,
                    );
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
                    const newValidator = this.isObjectSchemaSame(
                        objAValue,
                        objBValue,
                        JSON.parse(JSON.stringify(validator)),
                        depth + 1,
                    );
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
        },
    },
    ["Api"]: {
        execHref: async function () {},
        openInNewWindow: function (url = "") {
            if (Utils.String.isNullOrEmpty(url)) {
                return;
            }
            window.open(url, "_blank");
        },
    },
    ["Events"]: {
        mouseClick: function ($element) {
            $element.dispatchEvent(
                new MouseEvent("click", {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                }),
            );
        },
    },
    ["Lang"]: {
        setDelay: function (timeout) {
            return new Promise((r) => setTimeout(r, timeout));
        },
    },
};

function fn_validateJson(jsonData = {}) {
    const validationResult = Utils.Object.isObjectSchemaSame(
        jsonData,
        JSON.parse(TEST_JSON),
    );
    if (Utils.Object.isEmptyObject(validationResult)) {
        throw new Error("Invalid JSON");
    }
    if (validationResult.Result === false) {
        throw new Error(
            validationResult.Message +
                " at " +
                validationResult.TraceList.join(" -> "),
        );
    }
}

function fn_getRedirectSvg(width = 12, height = 12) {
    return (
        " " +
        `<svg xmlns="http://www.w3.org/2000/svg" 
                width="${width}" height="${height}" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round">

                <!-- Box -->
                <path d="M14 3h7v7"/>
                
                <!-- Arrow -->
                <path d="M10 14L21 3"/>
                
                <!-- Window frame -->
                <path d="M21 14v7h-7"/>
                <path d="M3 10v11h11"/>
            </svg>`
    );
}

function fn_isMobileView() {
    return window.innerWidth <= 768;
}

const TEST_JSON = `{
    "OwnerInfo": {
        "FirstName": "",
        "LastName": "",
        "PhoneNumber": "",
        "Tagline": "",
        "Socials": {
        "Instagram": "",
        "LinkedIn": "",
        "Github": "",
        "X": ""
        },
        "About": {
                "Name": "About",
                "TabContentFormat": "About",
                "TabContent": {
                    "ProfilePic": true,
                    "ProfilePicLink": "",
                    "ProfessionalExperience": [
                        {
                            "CompanyName": "Xorosoft Technologies",
                            "CompanyWebsiteLink": "",
                            "JobType": "Associate Software Engineer",
                            "Location": "On-site",
                            "JoinDate": "Jan 2024",
                            "EndDate": "",
                            "IsCurrentJob": true,
                            "Description": "Working on ERP/WMS systems. Built complex inventory, sales, and manufacturing modules. Optimized backend APIs (50k → <50 calls), improved query performance, and handled full dev → QA → release lifecycle."
                        }
                    ],
                    "Education": [
                        {
                            "Course": "Bachelor's in Computer Science",
                            "StartDate": "2020",
                            "EndDate": "2024",
                            "IsOngoing": false,
                            "Institution": "Your College",
                            "InstitutionWebsiteLink": ""
                        }
                    ],
                    "TechStack": [
                        ".NET (C#)",
                        "ASP.NET Core",
                        "SQL Server",
                        "JavaScript",
                        "React",
                        "Redis",
                        "Docker",
                        "TCP / Networking",
                        "Systems Programming"
                    ]
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
