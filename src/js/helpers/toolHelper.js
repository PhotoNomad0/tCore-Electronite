import path from 'path-extra';
import fs from 'fs-extra';
import {getToolCategories, getToolsByKey, getTranslate,} from '../selectors';
import * as alerts from '../reducers/alerts';
import {
  ALERT_ALIGNMENTS_AND_SELECTIONS_RESET_MSG,
  ALERT_ALIGNMENTS_RESET_ID,
  ALERT_SELECTIONS_INVALIDATED_ID,
  WORD_ALIGNMENT,
} from '../common/constants';

const WA_TOOL = require('../../tC_apps/wordAlignment/index');

/**
 * Loads all of the tools found in a directory
 * @ {string} dir - the directory containing tools to load
 * @returns {Array}
 */
export const loadToolsInDir = async toolsDir => {
  let tools = [];
  const promises = [];

  // TRICKY: fs.access does not work on asar directories so we cannot use `fs.access`
  if (!fs.existsSync(toolsDir)) {
    console.warn(`No tools found in missing directory ${toolsDir}.`);
    return [];
  }

  const toolHandles = {
    wordAlignment: WA_TOOL
  };

  const files = await fs.readdir(toolsDir);

  for (const f of files) {
    const toolPath = path.join(toolsDir, f);
    const toolHandle = toolHandles[f];
    if (toolHandle) {
      const stat = fs.statSync(toolPath);

      if (stat.isDirectory()) {
        try {
          console.log(`Loading tool "${f}`);
          promises.push(loadTool(toolsDir, f, toolHandle));
        } catch (e) {
          console.error(`Failed to load tool "${f}"`, e);
        }
      }
    } else {
      console.error(`Failed to pre-load tool "${f}", SKIPPING`);
    }
  }

  try {
    tools = await Promise.all(promises);
  } catch (e) {
    console.error(`Failed to load tools`, e);
  }
  return tools;
};

/**
 * Loads a tool from a directory.
 * This validates and loads the tool.
 * @param {string} toolsDir - path to the tools directory
 * @param {string} toolName
 * @return the tool object.
 */
export const loadTool = async (toolsDir, toolName, toolHandle) => {
  const toolDir = path.join(toolsDir, toolName);
  const basename = path.basename(toolDir);
  const packagePath = path.join(toolDir, 'package.json');
  const badgePath = path.join(toolDir, 'badge.png');

  // Validate package files
  const validatePaths = [packagePath, badgePath];

  for (const p of validatePaths) {
    const exists = fs.existsSync(p);

    if (!exists) {
      throw new Error(`Error loading tool "${basename}". Missing ${p}`);
    }
  }

  // load the actual tool
  const meta = await fs.readJson(packagePath);
  console.log('meta=' + JSON.stringify(meta));
  let tool = toolHandle.default;

  // try {
  //   //TODO: correct require path
  //   const toolRequirePath = path.join('./src', toolsDir, toolName, meta.main);
  //   console.log('toolPath=' + toolRequirePath);
  //   const index = require(toolRequirePath);
  //   // TODO: failed paths:
  //   // ../../../tC_apps/wordAlignment/index.js
  //   // ../../tC_apps/wordAlignment/index.js
  //   // ../tC_apps/wordAlignment/index.js
  //   // tC_apps/wordAlignment/index.js
  //   // /tC_apps/wordAlignment/index.js
  //   tool = index.default;
  // } catch (e) {
  //   const message = `Error loading tool "${basename}"`;
  //   console.error(message, e);
  //   throw new Error(message, e);
  // }

  // patch in some extra props
  tool.badge = badgePath;
  tool.version = meta.version;
  tool.title = meta.title;
  tool.description = meta.description;
  tool.path = toolDir;
  return tool;
};

/**
 * determines if invalidation alert is already showing
 * @param {String} toolName
 * @param {Object} state
 * @return {Boolean} - true if invalidation is displaying
 */
export const isInvalidationAlertDisplaying = (state, toolName) => {
  let selectionsInvalidAlert = alerts.findAlert(state, ALERT_SELECTIONS_INVALIDATED_ID);
  const alignmentsInvalidAlert = alerts.findAlert(state, ALERT_ALIGNMENTS_RESET_ID);

  if (alignmentsInvalidAlert) { // could also be combined alert, check message
    const alignAndSelectionsInvalidMessage = getTranslate(state)(ALERT_ALIGNMENTS_AND_SELECTIONS_RESET_MSG);

    if (alignmentsInvalidAlert.children === alignAndSelectionsInvalidMessage) {
      selectionsInvalidAlert = alignmentsInvalidAlert;
    }
  }

  const alertAlreadyDisplayed = toolName === WORD_ALIGNMENT ? alignmentsInvalidAlert : selectionsInvalidAlert;
  return !!alertAlreadyDisplayed;
};

/**
 * calls tool API to get invalid count for tool
 * @param {Object} state
 * @param {String} toolName
 * @return {number}
 */
export const getInvalidCountForTool = (state, toolName) => {
  let numInvalidChecks = 0;
  const toolApi = (getToolsByKey(state))[toolName];

  if (toolApi) {
    const selectedCategories = getToolCategories(state, toolName);
    numInvalidChecks = toolApi.api.trigger('getInvalidChecks', selectedCategories);
  }
  return numInvalidChecks;
};
