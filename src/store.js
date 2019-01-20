import _ from 'lodash';
import {
  observable,
  computed,
  action,
  isObservable,
  extendObservable  
} from 'mobx';

export default class State {
  @observable
  tabChangeEvent = false;
  @action.bound
  updateTabChangeEvent(bool) {
    this.tabChangeEvent = bool;
  }  
  @observable
  saveEvent = null;
  @action.bound
  updateSaveEvent(func) {
    this.saveEvent = func;
  }
  @observable
  executeHTML = null;
  @action.bound
  updateExecuteHTML(func) {
    this.executeHTML = func;
  }
  @observable
  runButton = null;
  @action.bound
  updateRunButton(element) {
    this.runButton = element;
  }
  @observable
  stopButton = null;
  @action.bound
  updateStopButton(element) {
    this.stopButton = element;
  }
  @observable
  hotReload = false;
  @action.bound
  updateHotReload(bool) {
    this.hotReload = bool;
  }
  @observable
  editor = null;
  @action.bound
  updateEditor(editor) {
    this.editor = editor;
  }
  @observable
  iframeElement = null;
  @action.bound
  async updateIframeElement(element) {
    this.iframeElement = await element;
  }
  @observable
  textFile = [
    {
      id: 0,
      type: 'html',
      fileName: 'index.html',
      removed: false,
      text: '',
      undoStack: null,
      redoStack: null
    }
  ];
  @action.bound
  pushTextFile(file) {
    if (
      !this.textFile.some(e => {
        return e.fileName === file.fileName;
      })
    ) {
      this.textFile.push(file);
      this.changeActiveTextFile(this.textFile.length - 1);
    }
  }
  @action.bound
  async removeTextFile(file) {
    const nextTextFile = this.textFile.filter(e => !_.isEqual(e, file));
    this.textFile = await nextTextFile;
  }
  @action.bound
  async clearTextFile() {
    this.textFile = await [];
  }
  @observable
  activeTextFile = this.textFile[0];
  @action.bound
  async changeActiveTextFile(index) {
    this.activeTextFile = await this.textFile[index];
  }
  @computed
  get activeTextFileId() {
    return this.textFile.findIndex(e => {
      return e.fileName === this.activeTextFile.fileName;
    });
  }
  @action.bound
  updateActiveText(text) {
    this.activeTextFile.text = text;
  }
  @action.bound
  async updateActiveUndoStack(undoStack) {
    this.activeTextFile.undoStack = await this.convertInPlace(undoStack);
  }
  @action.bound
  async updateActiveRedoStack(redoStack) {
    this.activeTextFile.redoStack = await this.convertInPlace(redoStack);
  }
  @observable
  convertInPlace = obj => {
    if (!obj || isObservable(obj)) return obj;
    if (Array.isArray(obj))
      return observable.array(obj.map(this.convertInPlace));
    if (typeof obj === 'object') {
      extendObservable(obj, {});
      const obj1 = obj;
      obj = observable({});
      Object.keys(obj1).forEach(key => {
        extendObservable(obj, {
          [key]: this.convertInPlace(obj1[key])
        });
      });
      return obj;
    }
    return obj;
  };
  @observable
  id = 0;
  @action.bound
  incrementId() {
    this.id++;
  }
  @observable
  runAreaRenderingFlag = false;
  @action.bound
  updateRunAreaRenderingFlag(bool) {
    this.runAreaRenderingFlag = bool;
  }
  @observable
  runAreaPosition = { x: window.innerWidth - 600, y: 100 };
  @action.bound
  updateRunAreaPosition(x, y) {
    this.runAreaPosition.x = x;
    this.runAreaPosition.y = y;
  }
  @observable
  unbreraGUIAreaRenderingFlag = false;
  @action.bound
  updateUnbreraGUIAreaRenderingFlag(bool) {
    this.unbreraGUIAreaRenderingFlag = bool;
  }
  @observable
  unbreraGUIAreaPosition = { x: window.innerWidth - 600, y: 500 };
  @action.bound
  updateUnbreraGUIAreaPosition(x, y) {
    this.unbreraGUIAreaPosition.x = x;
    this.unbreraGUIAreaPosition.y = y;
  }
  @observable
  runButtonColor = {
    backgroundColor: '#eee',
    fontColor: ' #e38'
  };
  @action.bound
  updateRunButtonColor(obj) {
    this.runButtonColor = obj;
  }
  @observable
  undoManager = null;
  @action.bound
  updateUndoManager(undoManager) {
    this.undoManager = undoManager;
  }
  @observable
  visualizeTreeUndoFunction = null;
  @action.bound
  updateVisualizeTreeUndoFunction(func) {
    this.visualizeTreeUndoFunction = func;
  }
  @observable
  imgSize = 50;
  @observable
  currentStackBackgroundSize = 60;
  @observable
  unbreraGUIAreaWidth = 500;
  @observable
  unbreraGUIAreaHeight = 250;
  @observable headerHeight = 20;
}
