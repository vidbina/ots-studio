# OTS Studio
OTS should enable a user to do the following:

The fist version allows the drawing of graphs. Clicking open will load a temporary file embedded with the codebase that was used for testing. Currently work is being done to present a open dialog (https://github.com/atom/tree-view/issues/399), allowing the user to select an arbitrary file. At that stage, saving will be enabled again. One can load a test pre-set overlay by clicking on Layers. The idea is that through the properties explorer one will be able to specify a arbitrary overlay, but the plumbing for that is dependent on the dialog issues being resolved.

The current file is a build for OSX. There is at least 300 MB of data embedded within the executable that can be stripped out, but first things first. The features to be enabled in order of importance are:

 - [x] Edit the network by drawing new nodes and links
 - [ ] Modify the nodes and links through the property editor
 - [ ] Save a networks
 - [ ] Load a network
 - [ ] Draw a background image to be used as overlay

**Objective:** Discover if the drawing logic is somewhat intuitive and what needs to be modified to make drawing somewhat easier for the end-user. Anything related to the properties is not being tested in this run, because the properties pane is not enabled yet. That will be exposed in the next release.

## Setup

Setup npm, enter the project directory and install all dependencies:

```npm install ```

### Run

Run the application by running

```npm run-script start```


### Build

Build the application by running

```npm run-script build-osx```
