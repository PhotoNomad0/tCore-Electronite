import translationWords from '../index';

describe('Testing tool index.js', () => {
  test('Should return an object with all the required fields', () => {
    expect(Object.keys(translationWords)).toEqual(['name', 'api', 'tool_interface_version', 'container']);
    expect(translationWords.name).toBeDefined();
    expect(translationWords.api).toBeDefined();
    expect(translationWords.tool_interface_version).toBeDefined();
    expect(translationWords.container).toBeDefined();
  });

  test('Should return the correct tool name', () => {
    expect(translationWords.name).toEqual('translationWords');
  });
});
