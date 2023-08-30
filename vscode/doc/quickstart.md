# CodeGPT Extenstion Development Guidance

This is a simple guidance for developping CodeGPT extenstion (for VS Code), you can add customizable features to CodeGPT.

- **Install Requirements** 
  - Use ```npm install``` to install packages required in ```package.json```.

- **Modify Configuration**
  - Set your own ApiKey and ApiSecret in ```src/localconfig.ts```. .
  - If you want to enable a statistics collection, you need to set the server address for ```statsHerf```；If disabled，just set ```enableStats=false```。

- **Run and Debug**
  - Enter "Run and Debug" mode in the left Activity Bar in VS Code，and click on ```Run Extension``` to launch the extenstion to debug.
  - If the source code is modified, press ```cmd+R``` to reload the extension。

- **Generate VSIX Package**
  - Use ```npm install -g vsce``` to install 
  - Use ```vsce package``` to generate package in ```.vsix``` format.
  - In VS Code Extension settings, choose ```Install from VSIX``` to install the generated package.
  
If you have suggestions or developped cool features for CodeGPT, please raise issues and pull requests. 