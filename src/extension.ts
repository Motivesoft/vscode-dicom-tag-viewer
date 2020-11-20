
import * as vscode from 'vscode';
import { TagViewerEditorProvider } from './tagViewer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-dicom-tag-viewer" is now active!');

	const openWithCommand = vscode.commands.registerTextEditorCommand("vscode-dicom-tag-viewer.openFile", (textEditor: vscode.TextEditor) => {
		console.log('Invoking "vscode-dicom-tag-viewer.openFile" for "vscode-dicom-tag-viewer.tagViewer""');
		vscode.commands.executeCommand("vscode.openWith", textEditor.document.uri, "vscode-dicom-tag-viewer.tagViewer");
	});
	
	context.subscriptions.push(openWithCommand);
	context.subscriptions.push(TagViewerEditorProvider.register(context));
}

// this method is called when your extension is deactivated
export function deactivate() {}
