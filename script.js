let pageData = {};

const FAKE_DELAY = 125;
const MAX_CHARACTER_LENGTH_IN_JSON_STRINGS = 800;

// Everything below is driven by the "Config" block in db.json — there are no
// client-side switches. The end user cannot change these; the owner does, in JSON.
const FONT_MONO = "mono";
const FONT_SERIF = "serif";
const LAYOUT_STATIC = "static";
const LAYOUT_DYNAMIC = "dynamic";
const DEFAULT_FONT = FONT_MONO;
const DEFAULT_LAYOUT = LAYOUT_STATIC;
const DEFAULT_THEME = "cream-sienna";
// Themes available in style.css as `.theme-<name>` rules.
const THEMES = [
    "cream-sienna",
    "cream-pine",
    "slate-amber",
    "midnight-rose",
    "sand-plum",
];

const $NAVBAR = document.getElementsByClassName("navbar")[0];
const $MAIN_CONTENT = document.getElementsByClassName("main-content")[0];
const $INTRO = document.getElementsByClassName("intro")[0];
const $BASIC_INFO = document.getElementsByClassName("basic-info")[0];
const $NAME = document.getElementsByClassName("name")[0];
const $PHONE_NUMBER = document.getElementsByClassName("phone-number")[0];
const $TAGLINE = document.getElementsByClassName("tagline")[0];
const $SOCIALS = document.getElementsByClassName("socials")[0];
const $SKILLS = document.getElementsByClassName("skills")[0];

window.addEventListener("load", async function () {
    await fn_initPageAsync();
});

async function fn_initPageAsync() {
    try {
        await fn_fetchPageDataAsync();
        fn_applyConfig();
        await fn_buildProfileAsync();
        await fn_buildSkillsAsync();

        // Mobile is always single-page; on desktop the JSON config decides.
        const isSinglePage = fn_isMobileView() || fn_isStaticLayout();
        document.body.classList.add(
            isSinglePage ? "layout-static" : "layout-dynamic",
        );

        if (isSinglePage) {
            await fn_buildSinglePageAsync();
        } else {
            await fn_buildTabsAsync();
            Utils.Events.mouseClick($NAVBAR.firstElementChild);
        }
    } catch (e) {
        console.error(e);
        alert(e);
    }
}

function fn_getConfig() {
    const config = pageData.db && pageData.db["Config"];
    return config && typeof config === "object" ? config : {};
}

function fn_applyConfig() {
    const config = fn_getConfig();

    // Theme — apply the matching `.theme-<name>` class, falling back to default.
    let theme = Utils.String.toStringSafe(config["Theme"]).trim();
    if (!THEMES.includes(theme)) {
        theme = DEFAULT_THEME;
    }
    document.body.classList.add("theme-" + theme);

    // Font — mono by default, serif only when explicitly requested.
    const font = Utils.String.isEqual(config["Font"], FONT_SERIF)
        ? FONT_SERIF
        : DEFAULT_FONT;
    if (font === FONT_SERIF) {
        document.body.style.fontFamily = '"IM-Fell-DW-Pica", serif';
    } else {
        document.body.style.fontFamily = '"GoMono-Nerd", monospace';
    }
}

function fn_isStaticLayout() {
    // Static is the default; dynamic (tabbed) only when explicitly configured.
    const config = fn_getConfig();
    return !Utils.String.isEqual(config["Layout"], LAYOUT_DYNAMIC);
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

async function fn_buildSkillsAsync() {
    const tech =
        pageData.db["OwnerInfo"]["About"]["TabContent"]["TechStack"] || [];
    if (!tech.length) {
        return;
    }

    const $label = document.createElement("span");
    $label.classList.add("skills-label");
    $label.innerText = "Skills";
    $SKILLS.appendChild($label);

    tech.forEach((t) => {
        const $chip = document.createElement("span");
        $chip.classList.add("tech-chip");
        $chip.innerText = t;
        $SKILLS.appendChild($chip);
    });
}

// Single-page (static) layout — used on mobile and whenever Config.Layout is
// "static". Order: Experience, then Projects, then Education. Skills already
// live under the header, so they are not repeated here.
async function fn_buildSinglePageAsync() {
    await fn_emptyMainContentAsync();
    $MAIN_CONTENT.classList.add("main-content-single");

    const about = pageData.db["OwnerInfo"]["About"]["TabContent"];
    const exp = about["ProfessionalExperience"] || [];
    const edu = about["Education"] || [];

    if (exp.length) {
        $MAIN_CONTENT.appendChild(fn_buildExperienceSection(exp));
    }

    for (let tab of pageData.db["Content"]["Tabs"]) {
        if (
            Utils.Object.isEmptyObject(tab) ||
            Utils.String.isNullOrEmpty(tab["Name"])
        ) {
            continue;
        }
        await Utils.Lang.setDelay(FAKE_DELAY);
        $MAIN_CONTENT.appendChild(
            fn_buildProjectsSection(tab["Name"], tab["TabContent"]),
        );
    }

    if (edu.length) {
        $MAIN_CONTENT.appendChild(fn_buildEducationSection(edu));
    }
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
                $MAIN_CONTENT.classList.add("main-content-other");
                $MAIN_CONTENT.classList.remove("main-content-about");
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
            $MAIN_CONTENT.classList.remove("main-content-other");
            $MAIN_CONTENT.classList.add("main-content-about");
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

function fn_createProjectBlock(c = {}) {
    const name = c["Name"];
    const nameLink = c["NameLink"];
    const description = c["Description"];
    const writeUp = "WriteUp";
    const writeUpLink = c["WriteUpLink"];

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

    $contentTitle.onclick = function () {
        Utils.Api.openInNewWindow(nameLink);
    };
    $writeupLink.onclick = function () {
        Utils.Api.execHref(writeUpLink);
    };

    return $contentBlock;
}

async function fn_loadGridContentAsync(content = {}) {
    await Utils.Lang.setDelay(FAKE_DELAY);
    if (Utils.Object.isEmptyObject(content)) {
        throw new Error("Invalid content [fn_getGridContent]");
    }
    (content["ContentList"] || []).forEach((c) => {
        $MAIN_CONTENT.appendChild(fn_createProjectBlock(c));
    });
}

function fn_createSection(titleText = "") {
    const $section = document.createElement("div");
    $section.classList.add("page-section");
    const $title = document.createElement("h2");
    $title.classList.add("section-title");
    $title.innerText = titleText;
    $section.appendChild($title);
    return $section;
}

function fn_createExperienceItem(e = {}) {
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
    return $item;
}

function fn_createEducationItem(e = {}) {
    const $item = document.createElement("div");
    $item.classList.add("about-item");
    $item.innerHTML = `
        <b>${e.Course}</b><br>
        ${e.Institution}<br>
        ${e.StartDate} - ${e.IsOngoing ? "Present" : e.EndDate}
    `;
    return $item;
}

function fn_buildExperienceSection(exp = []) {
    const $section = fn_createSection("Experience");
    exp.forEach((e) => $section.appendChild(fn_createExperienceItem(e)));
    return $section;
}

function fn_buildEducationSection(edu = []) {
    const $section = fn_createSection("Education");
    const $inner = document.createElement("div");
    $inner.classList.add("about-edu-section");
    edu.forEach((e) => $inner.appendChild(fn_createEducationItem(e)));
    $section.appendChild($inner);
    return $section;
}

function fn_buildProjectsSection(name = "Projects", content = {}) {
    const $section = fn_createSection(name);
    const $grid = document.createElement("div");
    $grid.classList.add("content-grid");
    (content["ContentList"] || []).forEach((c) => {
        $grid.appendChild(fn_createProjectBlock(c));
    });
    $section.appendChild($grid);
    return $section;
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

    const $container = document.createElement("div");
    $container.classList.add("about-root");

    if (showPic && picLink) {
        const $header = document.createElement("div");
        $header.classList.add("about-header");
        const $img = document.createElement("img");
        $img.src = picLink;
        $img.classList.add("about-pic");
        $header.appendChild($img);
        $container.appendChild($header);
    }

    // Skills now live under the page header (fn_buildSkillsAsync), not here.
    if (exp.length) {
        $container.appendChild(fn_buildExperienceSection(exp));
    }
    if (edu.length) {
        $container.appendChild(fn_buildEducationSection(edu));
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
        isObjectSchemaSame: function ({
            objA = {},
            objB = {},
            validator = {},
            depth = 0,
            validateCharacterLength = false,
        } = {}) {
            if (!(typeof objA === "object" && typeof objB === "object")) {
                throw new Error("Cannot check schema for non-object values");
            }
            if (depth > 10000) {
                throw new Error("Infinite recursion");
            }
            if (Utils.Object.isEmptyObject(validator)) {
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
                    function _arrayHelper(
                        arrA,
                        arrB,
                        _validator,
                        _depth = 0,
                        _validateCharacterLength = false,
                    ) {
                        if (!(Array.isArray(arrA) && Array.isArray(arrB))) {
                            throw new Error(
                                "Cannot check schema for non-array values during array validation",
                            );
                        }
                        if (_depth > 10000) {
                            throw new Error("Infinite recursion");
                        }
                        if (Utils.Object.isEmptyObject(_validator)) {
                            throw new Error(
                                "Invalid validator during array validation",
                            );
                        }

                        if (arrA.length === 0) {
                            // This means that this array's data is optional and can be of any type
                            return _validator;
                        }
                        if (arrB.length === 0) {
                            _validator.Result = false;
                            _validator.Message = `Empty array at required field: ${objAKey}(${typeof arrA}) <> ${objBKey}(${typeof arrB})}`;
                            return _validator;
                        }
                        const firstArrayElementObjA = arrA[0];
                        const firstArrayElementObjB = arrB[0];
                        if (
                            typeof firstArrayElementObjA !==
                            typeof firstArrayElementObjB
                        ) {
                            _validator.Result = false;
                            _validator.Message = `Uneven key value types: ${firstArrayElementObjA}(${typeof firstArrayElementObjA}) <> ${firstArrayElementObjB}(${typeof firstArrayElementObjB})}`;
                            return _validator;
                        }
                        if (
                            !arrB.every(
                                (x) =>
                                    typeof x === typeof firstArrayElementObjA,
                            )
                        ) {
                            _validator.Result = false;
                            _validator.Message = `Uneven key value types for sibling elements: ${firstArrayElementObjA}(${typeof firstArrayElementObjA}) <> ${firstArrayElementObjB}(${typeof firstArrayElementObjB})}`;
                            return _validator;
                        }
                        if (
                            firstArrayElementObjA &&
                            Array.isArray(firstArrayElementObjA)
                        ) {
                            return _arrayHelper(
                                firstArrayElementObjA,
                                firstArrayElementObjB,
                                _validator,
                                _depth + 1,
                                _validateCharacterLength,
                            );
                        }
                        if (arrA.length > 0) {
                            for (let _i = 0; _i < arrB.length; _i++) {
                                var _objAValue = firstArrayElementObjA;
                                var _objBValue = arrB[_i];
                                _validator.TraceList.push(_objBValue);
                                if (typeof _objBValue === "string") {
                                    if (_validateCharacterLength === true) {
                                        if (
                                            _objBValue.length >
                                            MAX_CHARACTER_LENGTH_IN_JSON_STRINGS
                                        ) {
                                            _validator.Result = false;
                                            _validator.Message = `Max character size reached`;
                                            return _validator;
                                        }
                                    }
                                    continue;
                                }
                                if (typeof _objBValue === "object") {
                                    const _newValidator =
                                        Utils.Object.isObjectSchemaSame({
                                            objA: _objAValue,
                                            objB: _objBValue,
                                            validator: JSON.parse(
                                                JSON.stringify(_validator),
                                            ),
                                            depth: _depth + 1,
                                            validateCharacterLength:
                                                _validateCharacterLength,
                                        });
                                    if (
                                        Utils.Object.isEmptyObject(
                                            _newValidator,
                                        )
                                    ) {
                                        _validator.Result = false;
                                        _validator.Message = `Invalid validator returned during object recursion`;
                                        return _validator;
                                    }
                                    if (_newValidator.Result === false) {
                                        _validator.Result = false;
                                        _validator.Message =
                                            _newValidator.Message;
                                        return _validator;
                                    }
                                    continue;
                                }
                                _validator.TraceList.pop();
                            }
                        }
                        return _validator;
                    }
                    const newValidator = _arrayHelper(
                        objAValue,
                        objBValue,
                        JSON.parse(JSON.stringify(validator)),
                        depth + 1,
                        validateCharacterLength,
                    );
                    if (Utils.Object.isEmptyObject(newValidator)) {
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
                    const newValidator = Utils.Object.isObjectSchemaSame({
                        objA: objAValue,
                        objB: objBValue,
                        validator: JSON.parse(JSON.stringify(validator)),
                        depth: depth + 1,
                        validateCharacterLength: validateCharacterLength,
                    });
                    if (Utils.Object.isEmptyObject(newValidator)) {
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
                if (typeof objBValue === "string") {
                    if (validateCharacterLength === true) {
                        if (
                            objBValue.length >
                            MAX_CHARACTER_LENGTH_IN_JSON_STRINGS
                        ) {
                            validator.Result = false;
                            validator.Message = `Max character size reached`;
                            return validator;
                        }
                    }
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
    const validationResult = Utils.Object.isObjectSchemaSame({
        objA: JSON.parse(TEST_JSON),
        objB: jsonData,
        validateCharacterLength: true,
    });
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
    "Config": {
        "Theme": "",
        "Font": "",
        "Layout": ""
    },
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
