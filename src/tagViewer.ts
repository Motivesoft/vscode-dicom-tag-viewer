import * as path from 'path';
import * as vscode from 'vscode';
import * as parser from 'dicom-parser';
import { DicomDocument } from './dicomDocument';
import { disposeAll } from "./dispose";
import { getNonce } from './util';

/**
 * Provider for the editor.
 */
export class TagViewerEditorProvider implements vscode.CustomReadonlyEditorProvider<DicomDocument> {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new TagViewerEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(TagViewerEditorProvider.viewType, provider);

        console.log(`Registering "${TagViewerEditorProvider.viewType}"`);
        return providerRegistration;
	}

	private static readonly viewType = 'vscode-dicom-tag-viewer.tagViewer';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<DicomDocument> {
        const document = await DicomDocument.create(uri, openContext.backupId);

        // We don't need any listeners right now because the document is readonly
		const listeners: vscode.Disposable[] = [];

        // Check whether the file changes outside of our control - or maybe (TODO) just delete these listeners
		const watcher = vscode.workspace.createFileSystemWatcher(uri.fsPath); 
		listeners.push(watcher);
		listeners.push(watcher.onDidChange(e => {
			if (e.toString() === uri.toString()) {
                // TODO Find a way to do reload or revert or call open again - or just ditch this
                vscode.commands.executeCommand("workbench.action.files.revert");
			}
		}));
		listeners.push(watcher.onDidDelete(e => {
			if (e.toString() === uri.toString()) { 
				vscode.window.showWarningMessage("This file has been deleted", "Ignore", "Close Editor").then((response) => {
					if (response === "Close Editor") {
						vscode.commands.executeCommand("workbench.action.closeActiveEditor");
					}
				});
			}
		}));

        document.onDidDispose(() => disposeAll(listeners));

        return document;
    }

    public async resolveCustomEditor(
		document: DicomDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
        };
        
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
	}

    private getBodyHTML(document: DicomDocument): string {
		let dataSet: parser.DataSet;
		dataSet = parser.parseDicom(document.rawData);

		let html = "";
		for( var propertyName in dataSet.elements ) {
			var element = dataSet.elements[propertyName];
			var text = propertyName + ` (length=${element.length})`;
			html += `<p>${text}</p>`;
		}

		return html;
    }

    private getHtmlForWebview(webview: vscode.Webview, document: DicomDocument): string {
        let styleResetUri="";
        let styleVSCodeUri="";
        let styleMainUri="";
        let scriptUri="";
        let body = this.getBodyHTML(document);
		const nonce = getNonce();
		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

                <!--
				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleMainUri}" rel="stylesheet" />
                -->

                <title>DICOM Tag Viewer</title>
			</head>
			<body>
				${body}
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}