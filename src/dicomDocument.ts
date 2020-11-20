import * as vscode from "vscode";
import * as fs from "fs";
import { Disposable } from "./dispose";

export class DicomDocument extends Disposable implements vscode.CustomDocument {
    static async create(
		uri: vscode.Uri,
		backupId: string | undefined,
	): Promise<DicomDocument | PromiseLike<DicomDocument> > {

		const fileSize = (await vscode.workspace.fs.stat(uri)).size;
        const fileData = await vscode.workspace.fs.readFile(uri);

        return new DicomDocument(uri, fileData, fileSize);
    }

    private readonly _uri: vscode.Uri;
	private _documentData: Uint8Array;
    private _documentSize: number;

    private constructor(
        uri: vscode.Uri,
        fileData: Uint8Array,
        fileSize: number
    ) {
        super();
        this._uri = uri;
        this._documentData = fileData;
        this._documentSize = fileSize;

        // TODO look at HexEditor for things like SearchProvider
        // Work out how to make this a readonly editor
    }

    public get uri(): vscode.Uri { return this._uri; }
    public get rawData(): Uint8Array { return this._documentData; }
    public get dataSize(): number { return this._documentSize; }

    private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
    public readonly onDidDispose = this._onDidDispose.event;

    dispose(): void {
        // Notify subsribers to the custom document we are disposing of it
        this._onDidDispose.fire();

        // Disposes of all the events attached to the custom document
        super.dispose();
	}
}