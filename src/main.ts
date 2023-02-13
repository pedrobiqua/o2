import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian'
import {DEFAULT_SETTINGS, O2PluginSettings, O2SettingTab} from "./settings"
import {O2Modal} from "./o2Modal"
import {convertToJekyll} from "./jekyll"
import {Temporal} from "@js-temporal/polyfill"

export default class O2Plugin extends Plugin {
    settings: O2PluginSettings

    async onload() {
        await this.loadSettings()

        // This adds an editor command that can perform some operation on the current editor instance
        this.addCommand({
            id: 'sample-editor-command',
            name: 'Sample editor command',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                console.log(editor.getSelection())
                editor.replaceSelection('Sample Editor Command')
            }
        })
        // This adds a complex command that can check whether the current state of the app allows execution of the command
        this.addCommand({
            id: 'open-sample-modal-complex',
            name: 'Open sample modal (complex)',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView)
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.
                    if (!checking) {
                        new O2Modal(this.app).open()
                    }

                    // This command will only show up in Command Palette when the check function returns true
                    return true
                }
            }
        })

        // move the file in ready directory to published directory
        this.addCommand({
            id: 'move-file-to-published',
            name: 'Move file to published',
            checkCallback: (checking: boolean) => {
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView)
                if (markdownView) {
                    if (!checking) {
                        const file = markdownView.file
                        const from = this.settings.draftDir
                        const to = this.settings.publishedDir
                        const toPath = file.path.replace(from, to)
                        this.app.vault.rename(file, toPath)
                    }
                    return true
                }
            }
        })

        this.addCommand({
            id: 'test-command',
            name: 'Test Command',
            callback: async () => {
                this.copyToPublishedDirectory();
                // rename markdown file to yyyy-mm-dd-title.md
                let tFiles = await this.renameMarkdownFile();

                // TODO: init jekyll from to folder
                return await convertToJekyll(tFiles);

            }
        })

        this.addCommand({
            id: 'check-command',
            name: 'check current file',
            callback: () => {
                // /Users/haril/Documents/projects/devlog/_posts
                this.renameMarkdownFile()
            }
        })

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new O2SettingTab(this.app, this))

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            console.log('click', evt)
        })

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000))
    }

    private copyToPublishedDirectory() {
        let markdownFiles = this.app.vault.getMarkdownFiles()
        markdownFiles.forEach(async (file: TFile) => {
            return await this.app.vault.copy(file, file.path.replace(this.settings.draftDir, this.settings.publishedDir))
        })
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }

    private async renameMarkdownFile() {
        let dateString = Temporal.Now.plainDateISO().toString();
        let markdownFiles = this.app.vault.getMarkdownFiles()
        for (const file of markdownFiles) {
            let newFileName = dateString + "-" + file.name
            let newFilePath = file.path
                .replace(file.name, newFileName)
                .replace(" ", "-")
            console.log('new File path: ' + newFilePath)
            await this.app.vault.rename(file, newFilePath);
        }
        return markdownFiles
    }
}


