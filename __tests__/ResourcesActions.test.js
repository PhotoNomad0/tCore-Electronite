import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import path from 'path-extra';
import fs from 'fs-extra';
// actions
import * as ResourcesActions from '../src/js/actions/ResourcesActions';
// constants
import {
  PROJECTS_PATH,
  USER_RESOURCES_PATH,
  ORIGINAL_LANGUAGE,
  TARGET_LANGUAGE,
  TARGET_BIBLE,
  WORD_ALIGNMENT,
} from '../src/js/common/constants';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('ResourcesActions', () => {
  beforeEach(() => {
    // reset mock filesystem data
    fs.__resetMockFS();
    fs.__setMockFS({}); // initialize to empty
  });
  afterEach(() => {
    // reset mock filesystem data
    fs.__resetMockFS();
  });

  it('makeSureBiblesLoadedForTool() should work', () => {
    // given
    const bookId = 'gal';
    const expectedResources = ['ult', 'ust'];

    loadMockFsWithProjectAndResources();
    fs.copySync(path.join(USER_RESOURCES_PATH, 'el-x-koine/bibles/ugnt'), path.join(USER_RESOURCES_PATH, 'hi/bibles/uhb'));

    const ugnt = require('./fixtures/project/en_gal/bibleData.json');

    const store = mockStore({
      actions: {},
      toolsReducer: { selectedTool: WORD_ALIGNMENT },
      resourcesReducer: {
        bibles: { originalLanguage: { ugnt } },
        translationHelps: {},
        lexicons: {},
      },
      contextIdReducer: {
        contextId: {
          reference: {
            bookId: bookId,
            chapter:1,
          },
        },
      },
      settingsReducer: {
        toolsSettings: {
          ScripturePane: {
            currentPaneSettings: [
              {
                bibleId: TARGET_BIBLE,
                languageId: TARGET_LANGUAGE,
              }, {
                bibleId: 'ugnt',
                languageId: ORIGINAL_LANGUAGE,
              }, {
                bibleId: 'ust',
                languageId: 'en',
              }, {
                bibleId: 'ult',
                languageId: 'en',
              },
            ],
          },
        },
      },
    });

    // when
    store.dispatch(
      ResourcesActions.makeSureBiblesLoadedForTool()
    );

    // then
    const actions = store.getActions();
    validateExpectedResources(actions, 'ADD_NEW_BIBLE_TO_RESOURCES', 'bibleId', expectedResources);
  });



  it('loads a book resource', () => {
    const bookId = 'gal';
    const expectedFirstWord = {
      'text': 'Παῦλος',
      'tag': 'w',
      'type': 'word',
      'lemma': 'Παῦλος',
      'strong': 'G39720',
      'morph': 'Gr,N,,,,,NMS,',
      'tw': 'rc://*/tw/dict/bible/names/paul',
    };

    const expectedResources = ['en', ORIGINAL_LANGUAGE, TARGET_LANGUAGE];

    const projectPath = path.join(PROJECTS_PATH, 'en_gal');
    loadMockFsWithProjectAndResources();

    const store = mockStore({
      actions: {},
      wordAlignmentReducer: { alignmentData: { ugnt: { } } },
      toolsReducer: { selectedTool: WORD_ALIGNMENT },
      projectDetailsReducer: {
        manifest: {
          project: { id: bookId },
          toolsSelectedGLs: { translationWords: 'en' },
        },
        projectSaveLocation: path.resolve(projectPath),
      },
      resourcesReducer: {
        bibles: { targetLanguage: { targetBible: { 1: {} } } },
        translationHelps: {},
        lexicons: {},
      },
      contextIdReducer: {
        contextId: {
          reference: {
            bookId: bookId,
            chapter:1,
          },
        },
      },
    });
    const contextId = {
      reference: {
        bookId: bookId,
        chapter: 1,
      },
    };

    // when
    store.dispatch(
      ResourcesActions.loadBookTranslations(contextId.reference.bookId)
    );

    // then
    const state = store.getState();
    expect(state).not.toBeNull();

    const actions = store.getActions();
    validateExpectedResources(actions, 'ADD_NEW_BIBLE_TO_RESOURCES', 'languageId', expectedResources);

    // make sure more than one chapter was loaded
    for (const a of actions) {
      expect(Object.keys(a.bibleData).length > 1).toBeTruthy();
    }

    // make sure UGNT loaded and has expected format
    let ugntAction = getAction(actions, 'ADD_NEW_BIBLE_TO_RESOURCES', 'languageId', ORIGINAL_LANGUAGE, 'bibleId', 'ugnt');
    expect(ugntAction).not.toBeNull();
    let firstChapter = ugntAction.bibleData[1];
    let firstVerse = firstChapter[1];

    if (firstVerse.verseObjects) {
      firstVerse = firstVerse.verseObjects;
    }

    let firstWord = firstVerse.find(object => (object.type === 'word'));
    expect(firstWord).toEqual(expectedFirstWord);
  });
});

//
// helpers
//

function getAction(actions, type, key, value, key2, value2) {
  for (let action of actions) {
    if (action.type === type) {
      if (!key || (action[key] === value) || (action[key] === value && action[key2] === value2)) {
        return action;
      }
    }
  }
  return null;
}

function validateExpectedResources(actions, type, key, expectedValues) {
  expect(actions).not.toBeNull();

  for (let expectedValue of expectedValues) {
    let found = getAction(actions, type, key, expectedValue);
    expect(found).not.toBeNull();
  }
}

function loadMockFsWithProjectAndResources() {
  const sourcePath = path.join('__tests__', 'fixtures', 'project');
  const copyFiles = ['en_gal'];
  fs.__loadFilesIntoMockFs(copyFiles, sourcePath, PROJECTS_PATH);

  const sourceResourcesPath = path.join('__tests__', 'fixtures', 'resources');
  const resourcesPath = USER_RESOURCES_PATH;
  const copyResourceFiles = [
    'en/bibles/ult',
    'en/bibles/ust',
    'el-x-koine/bibles/ugnt',
    'en/translationHelps/translationWords',
    'en/translationHelps/translationAcademy',
    'hi/translationHelps/translationWords'];
  fs.__loadFilesIntoMockFs(copyResourceFiles, sourceResourcesPath, resourcesPath);
}
