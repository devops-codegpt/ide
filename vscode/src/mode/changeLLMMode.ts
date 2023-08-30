import * as vscode from "vscode";
import { codegeexCodeGen } from "../utils/codegeexCodeGen";
import { updateStatusBarItem } from "../utils/updateStatusBarItem";

const addSignal = "<|add|>";
const andSignal = "<|and|>";
const hash = "<|hash|>";

export default async function changeLLMMode(
  editor: vscode.TextEditor,
  myStatusBarItem: vscode.StatusBarItem,
  g_isLoading: boolean
) {
  const document = editor.document;
  let selection: vscode.Selection;

  vscode.window.showInformationMessage(
    "change LLM to ChatGPT"
  );
}
