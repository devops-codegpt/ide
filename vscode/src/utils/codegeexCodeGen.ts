import * as vscode from "vscode";
import { myScheme } from "../param/constparams";
import { navUri } from "./navUri";

//generate uri for interactive mode
export const codegeexCodeGen = async (code_block: string) => {
    let loading = vscode.Uri.parse(
        `${myScheme}:CodeGPT?loading=true&mode=gen&code_block=${code_block}`,
        true
    );
    await navUri(loading, "python", "CodeGPT");
    let uri = vscode.Uri.parse(
        `${myScheme}:CodeGPT?loading=false&mode=gen&code_block=${code_block}`,
        true
    );
    await navUri(uri, "python", "CodeGPT");
};
