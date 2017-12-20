'use strict';
import * as vscode from 'vscode';
import * as edit from 'vscode-extension-common'
import { linesFromRange, replaceLines, expandRangeToBlockIfEmpty } from 'vscode-extension-common';
import { basename } from 'path';
import { ENGINE_METHOD_DIGESTS } from 'constants';

const gutterDecorationType = vscode.window.createTextEditorDecorationType({
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
});
export function sortLines(textEditor: vscode.TextEditor, ranges: Array<vscode.Range>) {
    if (ranges.length === 1) edit.sortLinesWithinRange(textEditor, edit.expandRangeToBlockIfEmpty(textEditor, ranges[0]));
    else edit.sortLinesByColumn(textEditor, ranges);
}
export function uniqueLines(textEditor: vscode.TextEditor, ranges: Array<vscode.Range>) {
    if(ranges.length === 1) {
        const rangeBlock = edit.expandRangeToBlockIfEmpty(textEditor, ranges[0]);
        const lines = edit.linesFromRange(textEditor.document, rangeBlock);
        const uniqueMep = new Map()
        lines.forEach(line => {
            uniqueMep.set(line.text, line);
        });

        const uniqueLines = uniqueMep.values()
        const linesArray = Array.from(uniqueLines);
        edit.replace(textEditor, rangeBlock, edit.textFromLines(textEditor.document, linesArray));
    }

}
export function uniqueLinesNewDocument(textEditor: vscode.TextEditor, ranges: Array<vscode.Range>) {
    if(ranges.length === 1) {
        const rangeBlock = edit.expandRangeToBlockIfEmpty(textEditor, ranges[0]);
        const lines = edit.linesFromRange(textEditor.document, rangeBlock);
        const uniqueMap = new Map()
        lines.forEach(line => {
            uniqueMap.set(line.text, line);
        });

        const uniqueLines = uniqueMap.values()
        const linesArray = Array.from(uniqueLines);
        vscode.workspace.openTextDocument({ 'language': textEditor.document.languageId, 'content': edit.textFromLines(textEditor.document, linesArray) })
            .then(document => vscode.window.showTextDocument(document, vscode.ViewColumn.Two, false))    
    }
}
                                                                                                                                        
export function filterLinesToNewDocument(textEditor: vscode.TextEditor, selection:vscode.Selection) {
    const selectedText = edit.textOfSelectionOrWordAtCursor(textEditor.document, selection);

    let filteredLines = [];
    return edit.promptForFilterExpression(selectedText)
        .then(fnFilter => {
            filteredLines = edit.filterLines(textEditor, fnFilter);
            const content = filteredLines.map(line => line.text).reduce((prev, curr) => prev + "\n" + curr);
            return vscode.workspace.openTextDocument({ 'language': textEditor.document.languageId, 'content': content });
        })
        .then(document => vscode.window.showTextDocument(document, vscode.ViewColumn.Two, false))
        .then(editor => {
            const decorations = filteredLines.map((line, index) => edit.createGutterDecorator(index, ': ' + (line.lineNumber + 1), '50px'));
            editor.setDecorations(gutterDecorationType, decorations);
            return editor;
        });
}

export function alignColumns(textEditor: vscode.TextEditor, ranges: Array<vscode.Range>) {
    //if (ranges.length === 1) autoAlign(textEditor, ranges[0]);
    const lineInfos = edit.makeLineInfos(textEditor, ranges);
    textEditor.edit(function (editBuilder) {
        lineInfos.forEach(line => {
            const lineLeftOfCursor = line.line.text.substring(0, line.range.start.character);
            const trimmedRight = line.line.text.substring(line.range.start.character).trim();

            editBuilder.replace(edit.expandRangeFullLineWidth(textEditor.document, line.range), lineLeftOfCursor + trimmedRight );
        });
    })
}