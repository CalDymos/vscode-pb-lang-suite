/**
 * PureBasic Project Manager
 * Manage project files and cross-file symbol parsing
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { Connection } from 'vscode-languageserver/node';
import {
    parseProjectFile,
    ProjectFile,
    ParsedProject,
    isProjectFile,
    extractProjectFiles,
    getProjectIncludeDirectories
} from '../parsers/project-parser';

export interface ProjectContext {
    projectFile: string;
    project: ProjectFile;
    includedFiles: Map<string, TextDocument>;
    globalSymbols: Map<string, any>;
    lastModified: number;
}

export class ProjectManager {
    private projects: Map<string, ProjectContext> = new Map();
    private fileToProject: Map<string, string> = new Map();
    private workspaceRoot: string = '';
    private connection: Connection;

    constructor(connection: Connection, workspaceRoot: string = '') {
        this.connection = connection;
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Set workspace root directory
     */
    public setWorkspaceRoot(root: string): void {
        this.workspaceRoot = root;
    }

    /**
     * Handle document open event
     */
    public onDocumentOpen(document: TextDocument): void {
        if (isProjectFile(document)) {
            this.loadProject(document);
        } else {
            this.associateFileWithProject(document);
        }
    }

    /**
     * Handle document close event
     */
    public onDocumentClose(document: TextDocument): void {
        const uri = document.uri;

        // If it's a project file, unload the project
        if (isProjectFile(document)) {
            this.unloadProject(uri);
        } else {
            // Remove from the project's included files
            this.removeFileFromProjects(uri);
        }
    }

    /**
     * Handle document content changes
     */
    public onDocumentChange(document: TextDocument): void {
        if (isProjectFile(document)) {
            // Project file changed, reload
            this.reloadProject(document);
        } else {
            // Regular file changed, update related project symbols
            this.updateProjectSymbols(document);
        }
    }

    /**
     * Load project file
     */
    private loadProject(document: TextDocument): void {
        const uri = document.uri;
        const parsedProject = parseProjectFile(document);

        if (!parsedProject) {
            this.connection.console.error(`Failed to parse project file: ${uri}`);
            return;
        }

        const projectContext: ProjectContext = {
            projectFile: uri,
            project: parsedProject.project,
            includedFiles: new Map(),
            globalSymbols: new Map(),
            lastModified: Date.now()
        };

        this.projects.set(uri, projectContext);

        // Parse included files in the project
        this.parseProjectIncludes(projectContext);

        this.connection.console.log(`Loaded project: ${parsedProject.project.name} (${uri})`);
    }

    /**
     * Reload project file
     */
    private reloadProject(document: TextDocument): void {
        const uri = document.uri;
        const existingProject = this.projects.get(uri);

        if (existingProject) {
            this.unloadProject(uri);
        }

        this.loadProject(document);
    }

    /**
     * Unload project
     */
    private unloadProject(uri: string): void {
        const project = this.projects.get(uri);
        if (project) {
            // Clean up file-to-project mapping
            for (const [fileUri, projectUri] of this.fileToProject) {
                if (projectUri === uri) {
                    this.fileToProject.delete(fileUri);
                }
            }

            this.projects.delete(uri);
            this.connection.console.log(`Unloaded project: ${uri}`);
        }
    }

    /**
     * Associate file with project
     */
    private associateFileWithProject(document: TextDocument): void {
        const uri = document.uri;
        const filePath = URI.parse(uri).fsPath;

        // Find projects that contain this file
        for (const [projectUri, project] of this.projects) {
            const projectFiles = extractProjectFiles(project.project);

            if (projectFiles.some(file => filePath.includes(file) || file.includes(filePath))) {
                this.fileToProject.set(uri, projectUri);
                project.includedFiles.set(uri, document);

                // Parse file symbols and add to project global symbol table
                this.parseFileSymbols(document, project.globalSymbols);
                break;
            }
        }
    }

    /**
     * Remove file from project
     */
    private removeFileFromProjects(uri: string): void {
        const projectUri = this.fileToProject.get(uri);
        if (projectUri) {
            const project = this.projects.get(projectUri);
            if (project) {
                project.includedFiles.delete(uri);
                this.fileToProject.delete(uri);

                // Remove this file's symbols from global symbols
                this.removeFileSymbols(uri, project.globalSymbols);
            }
        }
    }

    /**
     * Parse project included files
     */
    private async parseProjectIncludes(project: ProjectContext): Promise<void> {
        const includeDirectories = getProjectIncludeDirectories(project.project);

        // Here should implement asynchronous file reading, but since in language server,
        // we need to read files through workspace functions
        // temporarily leave empty, waiting for specific file reading implementation
    }

    /**
     * Parse file symbols
     */
    private parseFileSymbols(document: TextDocument, globalSymbols: Map<string, any>): void {
        const content = document.getText();
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Parse procedure definition
            if (line.startsWith('Procedure') || line.startsWith('Procedure.')) {
                const match = line.match(/(?:Procedure|Procedure\.\w+)\s+(\w+)\s*\(/);
                if (match) {
                    const procName = match[1];
                    globalSymbols.set(procName, {
                        type: 'procedure',
                        file: document.uri,
                        line: i,
                        definition: line
                    });
                }
            }

            // Parse variable declaration
            if (line.startsWith('Global') || line.startsWith('Define')) {
                const match = line.match(/(?:Global|Define)\s+(\w+)/);
                if (match) {
                    const varName = match[1];
                    globalSymbols.set(varName, {
                        type: 'variable',
                        file: document.uri,
                        line: i,
                        definition: line
                    });
                }
            }

            // Parse constant definition
            if (line.startsWith('#')) {
                const match = line.match(/#\s*(\w+)\s*=/);
                if (match) {
                    const constName = match[1];
                    globalSymbols.set(constName, {
                        type: 'constant',
                        file: document.uri,
                        line: i,
                        definition: line
                    });
                }
            }

            // Parse structure definition
            if (line.startsWith('Structure')) {
                const match = line.match(/Structure\s+(\w+)/);
                if (match) {
                    const structName = match[1];
                    globalSymbols.set(structName, {
                        type: 'structure',
                        file: document.uri,
                        line: i,
                        definition: line
                    });
                }
            }

            // Parse interface definition
            if (line.startsWith('Interface')) {
                const match = line.match(/Interface\s+(\w+)/);
                if (match) {
                    const interfaceName = match[1];
                    globalSymbols.set(interfaceName, {
                        type: 'interface',
                        file: document.uri,
                        line: i,
                        definition: line
                    });
                }
            }

            // Parse enumeration definition
            if (line.startsWith('Enumeration')) {
                const match = line.match(/Enumeration\s+(\w+)/);
                if (match) {
                    const enumName = match[1];
                    globalSymbols.set(enumName, {
                        type: 'enumeration',
                        file: document.uri,
                        line: i,
                        definition: line
                    });
                }
            }
        }
    }

    /**
     * Remove file symbols from global symbols
     */
    private removeFileSymbols(uri: string, globalSymbols: Map<string, any>): void {
        for (const [symbolName, symbol] of globalSymbols) {
            if (symbol.file === uri) {
                globalSymbols.delete(symbolName);
            }
        }
    }

    /**
     * Update project symbols
     */
    private updateProjectSymbols(document: TextDocument): void {
        const projectUri = this.fileToProject.get(document.uri);
        if (projectUri) {
            const project = this.projects.get(projectUri);
            if (project) {
                // Remove old symbols
                this.removeFileSymbols(document.uri, project.globalSymbols);

                // Add new symbols
                this.parseFileSymbols(document, project.globalSymbols);

                project.lastModified = Date.now();
            }
        }
    }

    /**
     * Get the project that the file belongs to
     */
    public getFileProject(uri: string): ProjectContext | null {
        const projectUri = this.fileToProject.get(uri);
        return projectUri ? this.projects.get(projectUri) || null : null;
    }

    /**
     * Get the project's global symbols
     */
    public getProjectSymbols(uri: string): Map<string, any> | null {
        const project = this.getFileProject(uri);
        return project ? project.globalSymbols : null;
    }

    /**
     * Find symbol definition
     */
    public findSymbolDefinition(symbolName: string, uri: string): any | null {
        const symbols = this.getProjectSymbols(uri);
        if (symbols) {
            return symbols.get(symbolName) || null;
        }
        return null;
    }

    /**
     * Get all projects
     */
    public getAllProjects(): ProjectContext[] {
        return Array.from(this.projects.values());
    }

    /**
     * Get project file path list
     */
    public getProjectFiles(): string[] {
        return Array.from(this.projects.keys());
    }

    /**
     * Check if file belongs to a project
     */
    public isFileInProject(uri: string): boolean {
        return this.fileToProject.has(uri);
    }
}