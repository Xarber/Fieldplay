// SPDX-License-Identifier: AGPL-3.0-only
const {withInfoPlist}=require('expo/config-plugins');
module.exports=config=>withInfoPlist(config,mod=>{delete mod.modResults.NSMicrophoneUsageDescription;return mod;});
