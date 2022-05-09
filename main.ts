import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, request } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
	rootPath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	rootPath: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	getFrontmatter () {
		const file = this.app.workspace.getActiveFile();
		let fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		
		if (fm === undefined) {
			new Notice('No frontmatter found.');
			return;
		}

		if (fm.slug === undefined) {
			new Notice('No slug found.');
			return;
		}

		return fm;
	}


	async onload() {
		await this.loadSettings();
		
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'update-kaneki-file',
			name: 'Send to Kaneki',
			editorCallback: async (editor: Editor) => {
				
				try {
					if (this.settings.rootPath === '') {
						new Notice('Please set the root path in the settings.');
						return;
					}
					
					
					const filePath = this.app.workspace.getActiveFile().path;

					const fm = this.getFrontmatter();

					if (fm.title === undefined) {
						new Notice('No title found.');
						return;
					}

					if (fm.excerpt === undefined) {
						new Notice('No excerpt found.');
						return;
					}

					const statusBarItemEl = this.addStatusBarItem();
					statusBarItemEl.setText('Calling Kaneki...');
					await request({
						url: 'http://localhost:3595/update',
						method: 'POST',
						contentType: 'application/json',
						body: JSON.stringify({
							filePath: this.settings.rootPath + filePath,
						})
					})
					statusBarItemEl.setText('');
					new Notice(`${filePath} successfully sent to Kaneki.`);
				} catch (err) {
					new Notice(err);
					return;
				}
			}
		});

		this.addCommand({
			id: 'open-kaneki-file',
			name: 'Open in Chrome',
			editorCallback: async (editor: Editor) => {
				
				try {
					if (this.settings.rootPath === '') {
						new Notice('Please set the root path in the settings.');
						return;
					}

					const fm = this.getFrontmatter();

					if (fm.slug === undefined) {
						new Notice('No slug found.');
						return;
					}
					
					const filePath = this.app.workspace.getActiveFile().path;	
	
					const statusBarItemEl = this.addStatusBarItem();
					statusBarItemEl.setText('Calling Kaneki...');
					await request({
						url: 'http://localhost:3595/open',
						method: 'POST',
						contentType: 'application/json',
						body: JSON.stringify({
							slug: fm.slug,
						})
					})
					statusBarItemEl.setText('');
					new Notice(`${filePath} successfully opened with Kaneki.`);
				} catch (err) {
					new Notice(err);
					return;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
		.setName('Obsidian Absolute Root Path')
		.setDesc('The absolute path to the Obsidian folder.')
		.addText(text => text
			.setPlaceholder('/some/path/to/obsidian')
			.setValue(this.plugin.settings.rootPath)
			.onChange(async (value) => {
				console.log('Root Path: ' + value);
				this.plugin.settings.rootPath = value;
				await this.plugin.saveSettings();
			}));
	}
}
