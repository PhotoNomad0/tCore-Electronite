import path from 'path';
import { connectTool } from 'tc-tool';
import {
  Api,
  Container,
  reducers,
} from 'checking-tool-wrapper';

export default connectTool('translationWords', {
  localeDir: path.join('./src/tC_apps/translationWords/src/locale'),
  api: new Api(),
  reducer: reducers,
})(Container);
