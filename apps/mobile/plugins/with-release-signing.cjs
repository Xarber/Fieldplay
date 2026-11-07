// SPDX-License-Identifier: AGPL-3.0-only
const {withAppBuildGradle}=require('expo/config-plugins');
module.exports=config=>withAppBuildGradle(config,mod=>{
 if(mod.modResults.contents.includes('// Fieldplay release signing'))return mod;
 mod.modResults.contents+=`\n// Fieldplay release signing: never distribute Expo's debug identity.
def fieldplayStore = System.getenv('FIELDPLAY_KEYSTORE')
if (fieldplayStore) {
    android.signingConfigs {
        fieldplayRelease {
            storeFile file(fieldplayStore)
            storePassword System.getenv('FIELDPLAY_STORE_PASSWORD')
            keyAlias System.getenv('FIELDPLAY_KEY_ALIAS')
            keyPassword System.getenv('FIELDPLAY_KEY_PASSWORD')
        }
    }
    android.buildTypes.release.signingConfig = android.signingConfigs.fieldplayRelease
} else {
    android.buildTypes.release.signingConfig = null
    gradle.taskGraph.whenReady { graph ->
        if (graph.allTasks.any { it.name.toLowerCase().contains('release') }) {
            throw new GradleException('Configure Fieldplay release signing secrets. Debug signing is not allowed for release artifacts.')
        }
    }
}
`;
 return mod;
});
