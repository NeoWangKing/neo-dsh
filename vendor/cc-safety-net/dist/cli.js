import{a,s,Me,nt,T,vt,rt,c,n,ot,_,S,ge,xt,m,Ie,x,st,l,o,w,i,ae,r,h,ye,W,wt,Ct,p,ve,be,Et,M,X,ce,C,kt,A,y,le,z,u,O,Q,at,ct,F,E,D,xe,Se,$e,ue,d,e,je,Oe,Ue,we,lt,ut,de,De,pe,He,ee,V,Ge,Ce,q,dt,K,te,ne,fe,pt,ft,k,I,Be,mt,ze,R,Ve,Ne,qe,v,t,re,Ee,b,j,g,N,Rt,Ke,Je,f,U}from"./chunks/index-pzctbrv3.js";import{Qe}from"./chunks/index-3s2q5wht.js";import{Ye,Re}from"./chunks/index-wshq0mgp.js";import{et}from"./chunks/index-2r2nzahr.js";import"./chunks/index-90bkfxht.js";import{ie,J,tt,G,B}from"./chunks/index-gkf3ty4y.js";var wf=["-h","--help"];function mn(P,L){let H=Object.entries(P.booleans??{}),Y=Object.entries(P.values??{}),Z=Object.entries(P.lists??{}),oe=Object.fromEntries(H.map(([_e])=>[_e,!1])),se={},me=Object.fromEntries(Z.map(([_e])=>[_e,[]])),he=[],ke=[],Pe=!1,Te=-1;for(let[_e,Ae]of L.entries()){if(_e<=Te)continue;if(Ae==="--"){he.push(...L.slice(_e+1));break}if(wf.includes(Ae)){Pe=!0;continue}let Le=H.find(([,Ze])=>Ze.includes(Ae));if(Le){oe[Le[0]]=!0;continue}let We=Y.find(([,Ze])=>Ze.includes(Ae));if(We){let Ze=L[_e+1];if(Ze===void 0||Ze.startsWith("-")){ke.push(`${Ae} requires a value`);continue}se[We[0]]=Ze,Te=_e+1;continue}let Fe=Z.find(([,Ze])=>Ze.includes(Ae));if(Fe){let Ze=L.slice(_e+1),tn=Ze.findIndex((ln)=>ln.startsWith("-")),on=Ze.slice(0,tn===-1?Ze.length:tn);if(on.length===0){ke.push(`${Ae} requires at least one value`);continue}me[Fe[0]]=[...me[Fe[0]]??[],...on],Te=_e+on.length;continue}if(Ae.startsWith("-")){ke.push(`Unknown option for ${P.label}: ${Ae}`);continue}if(P.positionals==="tail"){he.push(...L.slice(_e));break}he.push(Ae)}if(P.positionals!=="list"&&P.positionals!=="tail")ke.push(...he.map((_e)=>`Unexpected argument for ${P.label}: ${_e}`));return{flags:oe,values:se,lists:me,positionals:he,help:Pe,errors:ke}}function $n(P){for(let L of P)console.error(L);return P.length>0}import{readdirSync as Ef,statSync as Zs,unlinkSync as Tf}from"node:fs";import{basename as Xs,dirname as Af,isAbsolute as _f,join as If,relative as Of,resolve as $f,sep as Df}from"node:path";var zs=(P)=>{let L=Date.now()-new Date(P).getTime();if(!Number.isFinite(L))return"";let H=Math.floor(L/60000),Y=Math.floor(H/60),Z=Math.floor(Y/24);if(Z>0)return`${Z}d ago`;if(Y>0)return`${Y}h ago`;if(H>0)return`${H}m ago`;return"just now"},Go=(P)=>{let L=(P??"").trim().split(/\s+/).filter((Z)=>Z&&!/^[A-Za-z_][A-Za-z0-9_]*=/.test(Z)),H=L[0]?.split("/").pop();if(!H)return null;let Y=L[1];return Y&&/^[a-z][a-z0-9-]*$/.test(Y)?`${H} ${Y}`:H};function Ws(P){let L=(Z)=>`${Z.sessionId}
${Go(Z.segment||Z.command)}`,H=P.filter((Z)=>Z.decision!=="allow"),Y=H.filter((Z)=>Z.sessionId).reduce((Z,oe)=>Z.set(L(oe),(Z.get(L(oe))??0)+1),new Map);return new Set(H.filter((Z)=>Z.failureStage||(Y.get(L(Z))??0)>=2))}import{existsSync as kf,readdirSync as Cf,readFileSync as xf}from"node:fs";import{join as Pf}from"node:path";function Yn(P,L){try{return Cf(P,{withFileTypes:!0,encoding:"utf8"}).flatMap((H)=>{let Y=Pf(P,H.name);if(H.isDirectory())return Yn(Y,L);if(H.name.endsWith(".jsonl"))return[Y];return[]})}catch{if(L&&kf(P))L.count++;return[]}}var Sf=["segment","reason","sessionId","decision","agent","ruleId","failureStage"];function Rf(P){if(!P||typeof P!=="object"||Array.isArray(P))return!1;let L=P;if(typeof L.ts!=="string"||typeof L.command!=="string")return!1;return Sf.every((H)=>L[H]===void 0||typeof L[H]==="string")}function Dt(P,L){try{return xf(P,"utf-8").split(`
`).filter(Boolean).flatMap((H)=>{try{let Y=JSON.parse(H);if(!Rf(Y)){if(L)L.count++;return[]}return[Y]}catch{if(L)L.count++;return[]}})}catch{if(L)L.count++;return[]}}function gn(P){return Array.from(P,(L)=>{let H=L.charCodeAt(0);if(H<=31||H>=127&&H<=159)return`\\x${H.toString(16).padStart(2,"0")}`;return L}).join("")}function Nf(P,L){let H=ie(P),Y=mn({label:"logs",booleans:{all:["--all"],suspect:["--suspect"],json:["--json"],pruneLegacy:["--prune-legacy"],dryRun:["--dry-run"]},values:{id:["--id"],limit:["--limit"],since:["--since"],agent:["--agent"],rule:["--rule"],session:["--session"],project:["--project"]}},L);if($n(Y.errors))return null;if(Y.values.id!==void 0&&!/^[a-f0-9]{16}$/.test(Y.values.id))return console.error("--id must be 16 hexadecimal characters"),null;let Z=Y.values.limit===void 0?20:Ys(Y.values.limit);if(Z===null)return console.error("--limit must be a positive number"),null;let oe=Y.values.since===void 0?Math.min(30,H):Ys(Y.values.since);if(oe===null||oe>H)return console.error(`--since must be a positive number of days no greater than ${H}`),null;let se={limit:Z,limitExplicit:Y.values.limit!==void 0,since:oe,sinceExplicit:Y.values.since!==void 0,all:Y.flags.all,json:Y.flags.json,suspect:Y.flags.suspect,pruneLegacy:Y.flags.pruneLegacy,dryRun:Y.flags.dryRun,id:Y.values.id,agent:Y.values.agent,rule:Y.values.rule,session:Y.values.session,project:Y.values.project===void 0?void 0:$f(Y.values.project)};if(se.id&&(se.agent!==void 0||se.rule!==void 0||se.session!==void 0||se.project!==void 0||se.suspect||se.sinceExplicit||se.limitExplicit))return console.error("--id cannot be combined with --agent, --rule, --session, --project, --suspect, --since, or --limit"),null;if(se.pruneLegacy&&(se.id!==void 0||se.agent!==void 0||se.rule!==void 0||se.session!==void 0||se.project!==void 0||se.suspect||se.all||se.sinceExplicit||se.limitExplicit))return console.error("--prune-legacy cannot be combined with --id, --agent, --rule, --session, --project, --suspect, --all, --since, or --limit"),null;if(se.dryRun&&!se.pruneLegacy)return console.error("--dry-run requires --prune-legacy"),null;return se}async function Qs(P,L,H={}){let Y=Nf(P,L);if(!Y)return 1;let Z=H.logsDir??G(P);if(Y.pruneLegacy)return Lf(Z,Y.json,Y.dryRun);if(!Z)return console.log(Y.json?"[]":Y.id?`No retained audit log entry found for id ${gn(Y.id)}.`:"No audit log entries found."),0;J(P,Z);let oe={count:0},se=Yn(Z,oe).flatMap((Te)=>Dt(Te,oe).map((_e)=>({entry:_e,file:Te})));if(oe.count>0)console.error(`warning: ${oe.count} audit log ${oe.count===1?"source":"sources"} could not be read; these results are incomplete`);if(Y.id)return Mf(se,Y,H.timeZone);let me=Date.now()-Y.since*24*60*60*1000,he=se.filter((Te)=>Uf(Te,Y,Z,me)),ke=Y.suspect?Ws(he.map((Te)=>Te.entry)):null,Pe=(ke?he.filter((Te)=>ke.has(Te.entry)):he).sort((Te,_e)=>Date.parse(_e.entry.ts)-Date.parse(Te.entry.ts)).slice(0,Y.limit);if(Y.json)return console.log(JSON.stringify(Pe.map((Te)=>Te.entry),null,2)),0;if(Pe.length===0)return console.log("No audit log entries found."),0;for(let Te of Pe)console.log(qf(Te.entry,H.timeZone));return 0}function Lf(P,L,H){let Y=P?Ff(P).map((me)=>If(P,me)):[];if(H)return jf(Y,L);let Z=[],oe=0,se=0;for(let me of Y){let he=Zs(me,{throwIfNoEntry:!1})?.size??0,ke=Hf(me);if(ke){Z.push(`${Xs(me)}: ${ke}`);continue}oe++,se+=he}if(L)return console.log(JSON.stringify({removedFiles:oe,removedBytes:se,failedFiles:Z.length})),Z.length===0?0:1;console.log(oe===0&&Z.length===0?"No legacy audit log files found.":`Removed ${oe} legacy audit log ${oe===1?"file":"files"} (${ea(se)}).`);for(let me of Z)console.error(`Could not remove ${gn(me)}`);if(console.log("Nested v2 audit logs were not changed."),oe>0)console.log("This deletion cannot be undone.");return Z.length===0?0:1}function jf(P,L){let H=P.reduce((Y,Z)=>Y+(Zs(Z,{throwIfNoEntry:!1})?.size??0),0);if(L)return console.log(JSON.stringify({dryRun:!0,files:P.length,bytes:H})),0;if(console.log(P.length===0?"No legacy audit log files found.":`Would remove ${P.length} legacy audit log ${P.length===1?"file":"files"} (${ea(H)}).`),console.log("Nested v2 audit logs are not included."),P.length>0)console.log("Run the same command without --dry-run to delete them.");return 0}function Ff(P){try{return Ef(P,{withFileTypes:!0}).filter((L)=>L.isFile()&&L.name.endsWith(".jsonl")).map((L)=>L.name)}catch{return[]}}function Hf(P){try{return Tf(P),null}catch(L){return L instanceof Error?L.message:String(L)}}function ea(P){let L=["B","KiB","MiB","GiB"],H=Math.min(Math.floor(Math.log2(Math.max(P,1))/10),L.length-1);return`${Math.round(P/1024**H*10)/10} ${L[H]}`}function Mf(P,L,H){let Y=P.filter((oe)=>oe.entry.id===L.id);if(Y.length>1)return console.error(`Multiple audit log entries found for id ${gn(L.id??"")}.`),1;if(L.json)return console.log(JSON.stringify(Y.map((oe)=>oe.entry),null,2)),0;let Z=Y[0];if(!Z)return console.log(`No retained audit log entry found for id ${gn(L.id??"")}.`),0;return console.log(Vf(Z.entry,H)),0}function Uf(P,L,H,Y){if(!L.all&&P.entry.decision==="allow")return!1;if(Date.parse(P.entry.ts)<Y)return!1;if(L.agent!==void 0&&P.entry.agent!==L.agent)return!1;if(L.rule!==void 0&&P.entry.ruleId!==L.rule)return!1;if(L.session!==void 0&&!Bf(P,H,L.session))return!1;if(L.project!==void 0&&!Gf(P.entry.cwd,L.project))return!1;return!0}function Bf(P,L,H){if(P.entry.sessionId===H)return!0;return Af(P.file)===L&&Xs(P.file,".jsonl")===H}function Gf(P,L){if(!P)return!1;let H=Of(L,P);return H!==".."&&!H.startsWith(`..${Df}`)&&!_f(H)}function qf(P,L){let H=gn(P.id??"-"),Y=gn(P.decision??"deny"),Z=P.cwd?`  [${gn(P.cwd)}]`:"",oe=P.segment||P.command,se=oe===P.command?"":"↳ ",me=oe.length>50?`${oe.slice(0,50)}…`:oe;return`${H.padEnd(16)}  ${gn(na(P.ts,L))}  ${Y.padEnd(5)}  ${gn(P.agent??"-").padEnd(15)}  ${gn(P.ruleId??"-").padEnd(20)}  ${se}${gn(me)}${Z}`}function Vf(P,L){let H=(Z)=>gn(Z===void 0||Z===null||Z===""?"-":Z),Y=P.shape?`${P.agent??"-"} (shape: ${P.shape})`:P.agent??"-";return[`id:        ${H(P.id)}`,`ts:        ${H(na(P.ts,L))}`,`decision:  ${H(P.decision)}`,`agent:     ${H(Y)}`,`level:     ${H(P.level)}`,`tool:      ${H(P.toolName)}`,`rule:      ${H(P.ruleId)}`,`intent:    ${H(P.intent)}`,`stage:     ${H(P.failureStage)}`,`error:     ${H(P.errorCode)}`,`session:   ${H(P.sessionId)}`,`cwd:       ${H(P.cwd)}`,`version:   ${H(P.v)}`,`truncated: ${H(P.truncated===!0?"yes":void 0)}`,`reason:    ${H(P.reason)}`,`command:   ${H(P.command)}`,`segment:   ${H(P.segment)}`].join(`
`)}function na(P,L){let H=new Date(P);if(Number.isNaN(H.getTime()))return P;return new Intl.DateTimeFormat("sv-SE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:L}).format(H)}function Ys(P){let L=Number(P);return Number.isFinite(L)&&L>0?L:null}var ta={name:"doctor",aliases:["--doctor"],description:"Run diagnostic checks to verify installation and configuration",usage:"doctor [options]",options:[{flags:"--json",description:"Output diagnostics as JSON"},{flags:"--skip-update-check",description:"Skip npm registry version check"},{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net doctor","cc-safety-net doctor --json","cc-safety-net doctor --skip-update-check"]};var ra={name:"explain",description:"Show step-by-step analysis trace of how a command would be analyzed",usage:"explain [options] <command>",argument:"<command>",options:[{flags:"--json",description:"Output analysis as JSON"},{flags:"--cwd",argument:"<path>",description:"Use custom working directory"},{flags:"-h, --help",description:"Show this help"}],examples:['cc-safety-net explain "git reset --hard"','cc-safety-net explain --json "rm -rf /"','cc-safety-net explain --cwd /tmp "git status"']};var oa={name:"gui",description:"Open the local policy editor GUI",usage:"gui [options]",options:[{flags:"--no-open",description:"Print the URL without opening a browser"},{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net gui","cc-safety-net gui --no-open"]};var qo=["npx","--offline","--no-install","@deepseek-ai/dsh","--version"],ia=["cursor-agent","--version"],sa=[{id:"antigravity-cli",displayName:"Antigravity CLI",runtime:{flags:["-ac","--agy-cli"],description:"Run as Antigravity CLI PreToolUse hook",legacyTopLevelFlags:[]},install:{flag:"--agy-cli",artifactKind:"hook config",probeCommand:["agy","--version"]}},{id:"claude-code",displayName:"Claude Code",runtime:{displayName:"Coding CLI",flags:["-cc","--coding-cli"],legacyFlags:["--claude-code"],description:"Run as Coding CLI PreToolUse hook",legacyTopLevelFlags:["-cc","--claude-code"]},install:{flag:"--claude-code",artifactKind:"plugin",probeCommand:["claude","--version"]}},{id:"codex",displayName:"Codex",runtime:{flags:["-cx","--codex"],description:"Run as a Codex PreToolUse hook",legacyTopLevelFlags:[]},install:{flag:"--codex",artifactKind:"plugin",probeCommand:["codex","--version"]}},{id:"copilot-cli",displayName:"GitHub Copilot CLI",runtime:{flags:["-cp","--copilot-cli"],description:"Run as GitHub Copilot CLI PreToolUse hook",legacyTopLevelFlags:["-cp","--copilot-cli"]},install:{flag:"--copilot-cli",artifactKind:"plugin",probeCommand:["copilot","--binary-version"]}},{id:"gemini-cli",displayName:"Gemini CLI",runtime:{flags:["-gc","--gemini-cli"],description:"Run as Gemini CLI BeforeTool hook",legacyTopLevelFlags:["-gc","--gemini-cli"]},install:{flag:"--gemini-cli",artifactKind:"extension",probeCommand:["gemini","--version"]}},{id:"grok-build",displayName:"Grok Build",runtime:{flags:["-gb","--grok-build"],description:"Run as Grok Build PreToolUse hook",legacyTopLevelFlags:[]},install:{flag:"--grok-build",artifactKind:"hook config",probeCommand:["grok","--version"]}},{id:"hermes-agent",displayName:"Hermes Agent",runtime:{flags:["-ha","--hermes-agent"],description:"Run as Hermes Agent pre_tool_call hook",legacyTopLevelFlags:[]},install:{flag:"--hermes-agent",artifactKind:"plugin",probeCommand:["hermes","--version"]}},{id:"kimi-code",displayName:"Kimi Code",runtime:{flags:["-kc","--kimi-code"],description:"Run as Kimi Code PreToolUse hook",legacyTopLevelFlags:[]},install:{flag:"--kimi-code",artifactKind:"hook config",probeCommand:["kimi","--version"]}},{id:"openclaw",displayName:"OpenClaw",install:{flag:"--openclaw",artifactKind:"plugin",probeCommand:["openclaw","--version"]}},{id:"opencode",displayName:"OpenCode",install:{flag:"--opencode",artifactKind:"plugin",probeCommand:["opencode","--version"]}},{id:"pi",displayName:"Pi",install:{flag:"--pi",artifactKind:"package",probeCommand:["pi","--version"]}},{id:"cursor",displayName:"Cursor",runtime:{flags:["-cu","--cursor"],description:"Run as Cursor preToolUse hook",legacyTopLevelFlags:[]},install:{flag:"--cursor",artifactKind:"hook config",probeCommand:["cursor","--version"]}},{id:"deepseek-harness",displayName:"DeepSeek Harness",install:{flag:"--deepseek-harness",artifactKind:"package",probeCommand:qo}},{id:"devin",displayName:"Devin CLI",runtime:{flags:["-dv","--devin"],description:"Run as Devin CLI PreToolUse hook",legacyTopLevelFlags:[]},install:{flag:"--devin",artifactKind:"hook config",probeCommand:["devin","--version"]}},{id:"droid",displayName:"Factory Droid",runtime:{flags:["-fd","--droid"],description:"Run as Factory Droid PreToolUse hook",legacyTopLevelFlags:[]},install:{flag:"--droid",artifactKind:"hook config",probeCommand:["droid","--version"]}},{id:"amp",displayName:"Amp Code",install:{flag:"--amp",artifactKind:"plugin",probeCommand:["amp","--version"]}}],Vo=sa.slice().sort((P,L)=>P.displayName.localeCompare(L.displayName,"en")),Er=Vo.map((P)=>P.id).sort((P,L)=>Number(L==="claude-code")-Number(P==="claude-code")),er=Vo.filter((P)=>("runtime"in P)).map((P)=>({id:P.id,displayName:"displayName"in P.runtime?P.runtime.displayName:P.displayName,flags:P.runtime.flags,legacyFlags:"legacyFlags"in P.runtime?P.runtime.legacyFlags:[],description:P.runtime.description,legacyTopLevelFlags:P.runtime.legacyTopLevelFlags})),Rn=Vo.map((P)=>({id:P.id,...P.install})),Kf=Object.fromEntries(sa.map((P)=>[P.id,P.displayName]));function cn(P){return Kf[P]}var Jf=er.map((P)=>({flags:P.flags.join(", "),description:P.description})),zf=er.flatMap((P)=>P.flags.map((L)=>`cc-safety-net hook ${L}`)),aa={name:"hook",description:"Run as an agent CLI hook (reads JSON from stdin)",usage:"hook INTEGRATION_FLAG",options:[...Jf,{flags:"-h, --help",description:"Show this help"}],examples:zf};var la={name:"install",description:"Install CC Safety Net into a coding agent CLI",usage:"install [TARGET_FLAG]",options:[...Rn.map((P)=>({flags:P.flag,description:`Install ${cn(P.id)} ${P.artifactKind}`})),{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net install",...Rn.map((P)=>`cc-safety-net install ${P.flag}`)]},ca={name:"uninstall",description:"Uninstall CC Safety Net from a coding agent CLI",usage:"uninstall [TARGET_FLAG]",options:[...Rn.map((P)=>({flags:P.flag,description:`Uninstall ${cn(P.id)} ${P.artifactKind}`})),{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net uninstall",...Rn.map((P)=>`cc-safety-net uninstall ${P.flag}`)]},da={name:"update",description:"Update every installed CC Safety Net integration to the latest version",usage:"update",options:[{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net update"]};var ua={name:"logs",description:"Browse audit log entries recorded by hooks",usage:"logs [options]",options:[{flags:"--id",argument:"<id>",description:"Show one entry from retained history by its 16-character id (not guaranteed once it is older than the configured retention)"},{flags:"--limit",argument:"<n>",description:"Maximum entries to print",default:"20"},{flags:"--since",argument:"<days>",description:"Only include entries newer than this many days (max: the configured audit retention, 1-365)",default:"30"},{flags:"--agent",argument:"<name>",description:"Filter by agent name"},{flags:"--rule",argument:"<ruleId>",description:"Filter by rule id"},{flags:"--session",argument:"<id>",description:"Filter by session id"},{flags:"--project",argument:"<path>",description:"Filter by project path"},{flags:"--suspect",description:"Only denials that look like false positives"},{flags:"--all",description:"Include allow entries"},{flags:"--prune-legacy",description:"Permanently delete all legacy root-level logs; nested logs are untouched"},{flags:"--dry-run",description:"With --prune-legacy, report what would be deleted and delete nothing"},{flags:"--json",description:"Output entries as JSON"},{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net logs --id 3fa9c2d1a70e8b42","cc-safety-net logs --agent claude-code","cc-safety-net logs --project . --since 7","cc-safety-net logs --suspect --since 7","cc-safety-net logs --json","cc-safety-net logs --prune-legacy --dry-run","cc-safety-net logs --prune-legacy"]};var Tr={name:"policy",description:"Check and apply project or user policy proposals",usage:"policy <subcommand>",subcommands:[{usage:"check <file>",description:"Validate a policy proposal and print its diff"},{usage:"apply <file>",description:"Apply a proposal after confirming in a terminal"}],options:[{flags:"-g, --global",description:"Use the user-scope policy instead of the project one"},{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net policy check proposal.json","cc-safety-net policy apply proposal.json","cc-safety-net policy apply proposal.json --global"]};var Ko=[{flags:"--ref",argument:"<ref>",description:"Use a branch, tag, or commit"},{flags:"--only",argument:"<rulebook...>",description:"Add only these repository rulebooks"},{flags:"-g, --global",description:"Use user-scope rule config"},{flags:"-h, --help",description:"Show this help"}],Jo=["cc-safety-net rule add project-rules","cc-safety-net rule add acme/safety-rules","cc-safety-net rule add acme/safety-rules --only aws gcloud","cc-safety-net rule add acme/safety-rules --ref v2 --only aws","cc-safety-net rule add --only terraform aws"],Nt={name:"rule",description:"Manage CC Safety Net rule config and rulebook sources",usage:"rule <subcommand>",subcommands:[{usage:"init [--example]",description:"Create inert rule config"},{usage:"add [source] [--ref <ref>] [--only <rulebook...>]",description:"Add rulebook sources and sync"},{usage:"remove <source>",description:"Remove a rulebook source and sync"},{usage:"update [source]",description:"Re-fetch and vendor remote rulebooks"},{usage:"sync",description:"Deprecated: migrate lock and cache leftovers"},{usage:"list",description:"List active rulebooks"},{usage:"wrapper add <command>",description:"Trust a transparent command wrapper"},{usage:"wrapper remove <command>",description:"Remove a transparent command wrapper"},{usage:"wrapper list",description:"List transparent command wrappers"},{usage:"tool add <name...> [--cwd-arg <name>] [--project]",description:"Analyze community shell tools (user scope by default)"},{usage:"tool remove <name...> [--project]",description:"Stop analyzing declared tools"},{usage:"tool list",description:"List declared command tools in both scopes"},{usage:"migrate [--cleanup]",description:"Migrate legacy inline rules"},{usage:"doc",description:"Print the rulebook authoring guide"},{usage:"verify",description:"Validate rule config files"}],options:[{flags:"-g, --global",description:"Use user-scope rule config"},{flags:"--cleanup",description:"Delete legacy files after rule migrate verifies them"},{flags:"--delete-source",description:"Delete clean local source directory on remove"},{flags:"--example",description:"Create an inactive example rulebook with rule init"},{flags:"--project",description:"Use project-scope rule config with rule tool"},{flags:"--cwd-arg",argument:"<name>",description:"Name the working-directory argument with rule tool add"},...Ko.slice(0,2),{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net rule init","cc-safety-net rule init --example","cc-safety-net rule wrapper add rtk","cc-safety-net rule tool add ops_bash","cc-safety-net rule tool add ops_run_background --cwd-arg cwd --project",...Jo,"cc-safety-net rule update","cc-safety-net rule migrate --cleanup","cc-safety-net rule verify"]};var pa={name:"status",description:"Show what the runtime is enforcing right now",usage:"status",options:[{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net status"]};var fa={name:"statusline",description:"Print status line with mode indicators for shell integration",usage:"statusline --claude-code",options:[{flags:"-cc, --claude-code",description:"Print status line for Claude Code"},{flags:"-h, --help",description:"Show this help"}],examples:["cc-safety-net statusline -cc","cc-safety-net statusline --claude-code"]};var Ar=[pa,ta,ua,ra,Nt,Tr,la,da,ca,aa,oa,fa];function Wf(P){return P.aliases??[]}function _r(P){let L=P.toLowerCase();return Ar.find((H)=>H.name.toLowerCase()===L||Wf(H).some((Y)=>Y.toLowerCase()===L))}import{existsSync as Bh}from"node:fs";import{basename as Yf}from"node:path";function Ir(P,L=7,H=G(P)){let Y=Date.now()-L*24*60*60*1000,Z=[],oe=new Set,se=0,me,he,ke,Pe;if(H)J(P,H);let Te={count:0},_e=H?Yn(H,Te):[];for(let Le of _e)for(let We of Dt(Le,Te)){if(We.decision==="allow")continue;let Fe=new Date(We.ts).getTime();if(Fe>=Y){if(se++,oe.add(We.sessionId??Yf(Le,".jsonl")),he===void 0||Fe<=he)me=We.ts,he=Fe;if(Pe===void 0||Fe>Pe)ke=We.ts,Pe=Fe;Zf(Z,We,Fe)}}let Ae=Z.map((Le)=>({timestamp:Le.ts,command:Le.command,reason:Le.reason,relativeTime:zs(new Date(Le.ts))}));return{totalBlocked:se,sessionCount:oe.size,recentEntries:Ae,oldestEntry:me,newestEntry:ke,unreadable:Te.count}}function Zf(P,L,H){let Y=P.findIndex((Z)=>H>new Date(Z.ts).getTime());if(Y===-1){if(P.length<3)P.push(L);return}if(P.splice(Y,0,L),P.length>3)P.pop()}import{dirname as cm}from"node:path";import{dirname as Xf,join as Qf,resolve as em}from"node:path";var nm="config.json";function bn(P,L,H,Y){h(tm(P),`${JSON.stringify(L,null,2)}
`,H,Y)}function tm(P){return typeof P==="string"?ae(P):P}function Wo(P){return{errors:de(om(P),": "," "),ruleNames:new Set(He(P).map((L)=>L.toLowerCase()))}}var rm="must match pattern (letters, numbers, hyphens, underscores; max 64 chars)",ma="must match pattern (letters, numbers, hyphens, underscores)";function om(P){if(!ga(P))return[e([],"Config must be an object")];return[...P.version===1?[]:[e(["version"],"must be 1")],...im(P.rules)]}function im(P){if(P===void 0)return[];if(!Array.isArray(P))return[e(["rules"],"must be an array")];return[...P.flatMap((L,H)=>ga(L)?sm(L,["rules",H]):[e(["rules",H],"must be an object")]),...je(P)]}function sm(P,L){return[...zo(P.name,[...L,"name"],"required string",p,rm),...zo(P.command,[...L,"command"],"required string",E,ma),...P.subcommand===void 0?[]:zo(P.subcommand,[...L,"subcommand"],"must be a string if provided",E,ma),...am(P.block_args,[...L,"block_args"]),...lm(P.reason,[...L,"reason"]),...P.intent===void 0||De(P.intent)?[]:[e([...L,"intent"],Oe)]]}function zo(P,L,H,Y,Z){if(typeof P!=="string")return[e(L,H)];return Y.test(P)?[]:[e(L,Z)]}function am(P,L){if(!Array.isArray(P))return[e(L,"required array")];if(P.length===0)return[e(L,"must have at least one element")];return P.flatMap((H,Y)=>{if(typeof H!=="string")return[e([...L,Y],"must be a string")];return H===""?[e([...L,Y],"must not be empty")]:[]})}function lm(P,L){if(typeof P!=="string")return[e(L,"required string")];if(P==="")return[e(L,"must not be empty")];return P.length>D?[e(L,`must be at most ${D} characters`)]:[]}function ga(P){return!!P&&typeof P==="object"&&!Array.isArray(P)}function Yo(P){let L=ya(P);if(!L.ok)return L.result;return Wo(L.parsed)}function ya(P){let L=[],H=new Set;try{let Y=typeof P==="string"?ae(P):P,Z=r(Y);if(Z===null)return L.push(`File not found: ${Y.path}`),{ok:!1,result:{errors:L,ruleNames:H}};if(!Z.trim())return L.push("Config file is empty"),{ok:!1,result:{errors:L,ruleNames:H}};return{ok:!0,parsed:JSON.parse(Z)}}catch(Y){if(Y instanceof o)return L.push(Y.message),{ok:!1,result:{errors:L,ruleNames:H}};let Z=Y instanceof Error?Y.message:String(Y);return L.push(Y instanceof SyntaxError?"Invalid JSON":Z),{ok:!1,result:{errors:L,ruleNames:H}}}}function Lt(P){return em(P,".safety-net.json")}function Un(P){let L=ya(P);if(!L.ok)return L.result;let H=lt(L.parsed);return{errors:H.errors,ruleNames:H.sources}}function jt(P,L={}){return Qf(Xf(le(P,L)),nm)}function ha(P,L,H){let Y;try{if(r(L)===null)return{path:P,exists:!1,valid:!1,ruleCount:0};Y=Un(L),Y.errors.push(...V(P,H))}catch(Z){if(!(Z instanceof o))throw Z;Y={errors:[Z.message],ruleNames:new Set}}return{path:P,exists:!0,valid:Y.errors.length===0,ruleCount:Y.ruleNames.size,...Y.errors.length>0?{errors:Y.errors}:{}}}function dm(P,L){return{source:L,name:P.name,command:P.command,subcommand:P.subcommand,blockArgs:[...P.block_args],reason:P.reason}}function va(P,L){let H=z(P),Y=A(L),Z=cm(H),oe=ee(P,{cwd:L,userConfigPath:H,projectConfigPath:Y,userConfigDir:Z}),se=Q(P,{cwd:L,userConfigPath:H,projectConfigPath:Y,userConfigDir:Z}),me=new Map(oe.rulebooks.flatMap((he)=>he.rules.map((ke)=>[ke,he.source])));return{userConfig:ha(H,se.userConfigTarget,se.userScope),projectConfig:ha(Y,se.projectConfigTarget,se.projectScope),effectiveRules:oe.rules.map((he)=>dm(he,me.get(he.name)??"project"))}}var um=[{flag:n.level,description:"Safety level preset: standard, strict, or paranoid",defaultBehavior:"standard"},{flag:n.strict,description:"Legacy; equivalent to safety.overrides.fail_closed",defaultBehavior:"permissive"},{flag:n.paranoid,description:"Legacy; equivalent to safety.overrides.paranoid_rm and paranoid_interpreters",defaultBehavior:"off"},{flag:n.paranoidRm,description:"Legacy; equivalent to safety.overrides.paranoid_rm",defaultBehavior:"off"},{flag:n.paranoidInterpreters,description:"Legacy; equivalent to safety.overrides.paranoid_interpreters",defaultBehavior:"off"},{flag:n.worktree,description:"Allow local git discards in linked worktrees",defaultBehavior:"off"},{flag:n.debug,description:"Print diagnostic messages to stderr",defaultBehavior:"off"},{flag:n.auditScope,description:"Command decisions recorded: all, or blocked (privacy-minimizing, denials only)",defaultBehavior:"all"},{flag:n.projectTightenOnly,description:"Ignore project policy settings that weaken the user policy",defaultBehavior:"off"}];function ba(P){return[...um.map((L)=>({name:L.flag.name,value:ge(L.flag,P.env),isSet:xt(L.flag,P.env),legacyName:L.flag.legacyName,legacyValue:L.flag.legacyName?P.env.get(L.flag.legacyName):void 0,legacyIsSet:L.flag.legacyName?P.env.get(L.flag.legacyName)!==void 0:void 0,description:L.description,defaultBehavior:L.defaultBehavior})),{name:"CC_SAFETY_NET_HOME",value:P.env.get("CC_SAFETY_NET_HOME"),isSet:P.env.get("CC_SAFETY_NET_HOME")!==void 0,description:"Override user-scope config/cache directory",defaultBehavior:"~/.cc-safety-net"}]}var wa={error:0,warning:1,info:2},pm=["policy","config","audit"];function fm(P){return P.map((L)=>{if(L==="ownership")return"is not owned by the current user";if(L==="permissions")return"has unsafe permissions";if(L==="symlink")return"is a symbolic link";return"is not a directory"}).join(" and ")}var mm=[{derive:(P)=>P.hooks.length>0&&P.hooks.every((L)=>!L.configured)?[{checkId:"integration.none-configured",severity:"error",title:"No integration configured",detail:"CC Safety Net is not connected to any supported coding-agent integration.",fixHint:"Run `cc-safety-net install` and configure at least one integration."}]:[]},{derive:(P)=>P.hooks.filter((L)=>L.inspectionStatus==="failed").map((L)=>{let H=cn(L.platform);return{checkId:"integration.inspection-failed",severity:"error",title:`${H} inspection failed`,detail:`Doctor could not verify the ${H} integration configuration.`,fixHint:`Correct the reported ${H} configuration error, then run \`cc-safety-net doctor\` again.`,integration:L.platform}})},{derive:(P)=>P.userConfig.exists&&!P.userConfig.valid?[{checkId:"config.user-invalid",severity:"error",title:"User configuration is invalid",detail:"Doctor could not load a valid user rules configuration.",fixHint:"Run `cc-safety-net rule verify`, correct the reported error, then rerun doctor.",path:P.userConfig.path}]:[]},{derive:(P)=>P.projectConfig.exists&&!P.projectConfig.valid?[{checkId:"config.project-invalid",severity:"error",title:"Project configuration is invalid",detail:"Doctor could not load a valid project rules configuration.",fixHint:"Run `cc-safety-net rule verify`, correct the reported error, then rerun doctor.",path:P.projectConfig.path}]:[]},{derive:(P)=>P.configState.state==="degraded"?[{checkId:"config.runtime-degraded",severity:"warning",title:"Runtime is enforcing a fallback configuration",detail:`The rejected candidate configuration is not active: ${P.configState.reason}`,fixHint:"Fix the file named in the reason, or run `cc-safety-net rule update` to vendor a remote source, then rerun doctor."}]:[]},{derive:(P)=>P.v2Leftovers&&P.v2Leftovers.length>0?[{checkId:"config.v2-leftovers",severity:"info",title:"Rulebook lock and cache leftovers detected",detail:`Files an earlier version left behind are no longer read: ${P.v2Leftovers.join(", ")}.`,fixHint:"Run `cc-safety-net rule sync` (add `--global` for user scope) to migrate them, then rerun doctor."}]:[]},{derive:(P)=>P.legacyConfigs&&P.legacyConfigs.length>0?[{checkId:"config.legacy-ignored",severity:"warning",title:"Legacy inline rule configs are ignored",detail:`CC Safety Net no longer loads these files, so their rules enforce nothing: ${P.legacyConfigs.join(", ")}.`,fixHint:"Run `cc-safety-net rule migrate` to convert them (add `--cleanup` to delete each file once it is converted), then rerun doctor."}]:[]},{derive:(P)=>{let L=P.environment.find((H)=>H.name==="CC_SAFETY_NET_AUDIT_SCOPE");return ot(L?.value)==="invalid"?[{checkId:"environment.audit-scope-invalid",severity:"warning",title:"Audit scope value is invalid",detail:"CC_SAFETY_NET_AUDIT_SCOPE is not `all` or `blocked`, so allowed command decisions are not recorded.",fixHint:"Set CC_SAFETY_NET_AUDIT_SCOPE to `all` or `blocked`, then restart the integration."}]:[]}},...pm.map((P)=>({derive:(L)=>L.posture.directories.filter((H)=>H.kind===P&&H.status==="unsafe").map((H)=>({checkId:`posture.${P}-directory-unsafe`,severity:"error",title:`${P[0]?.toUpperCase()}${P.slice(1)} directory is unsafe`,detail:`The ${P} directory ${fm(H.issues)}.`,fixHint:"Ensure this is a real directory owned by the current user with no group or other write access, then rerun doctor.",...H.path?{path:H.path}:{}}))})),{derive:(P)=>{let L=[...P.effectiveSafety.weakenedRuleOverrides].sort();return L.length>0?[{checkId:"posture.rule-overrides-weaken-preset",severity:"warning",title:"Rule overrides weaken the selected preset",detail:`Explicit overrides disable rules the resolved preset would enable: ${L.join(", ")}.`,fixHint:`Remove these \`off\` overrides or set them to \`on\`: ${L.join(", ")}.`}]:[]}}];function ka(P){return mm.flatMap((L,H)=>L.derive(P).map((Y,Z)=>({finding:Y,catalogOrder:H,occurrence:Z}))).sort((L,H)=>wa[L.finding.severity]-wa[H.finding.severity]||L.catalogOrder-H.catalogOrder||L.occurrence-H.occurrence).map((L)=>L.finding)}function Dn(){return Boolean(process.stdout.isTTY&&!process.env.NO_COLOR)}var gm=(P)=>Dn()?`\x1B[32m${P}\x1B[0m`:P,ym=(P)=>Dn()?`\x1B[33m${P}\x1B[0m`:P,hm=(P)=>Dn()?`\x1B[34m${P}\x1B[0m`:P,vm=(P)=>Dn()?`\x1B[36m${P}\x1B[0m`:P,bm=(P)=>Dn()?`\x1B[31m${P}\x1B[0m`:P,wm=(P)=>Dn()?`\x1B[2m${P}\x1B[0m`:P,km=(P)=>Dn()?`\x1B[1m${P}\x1B[0m`:P,en={green:gm,yellow:ym,blue:hm,cyan:vm,red:bm,dim:wm,bold:km},Cm="\x1B[0m",xm=[39,82,198,226,208,51,196,46,201,214,93,154,220,27,49,190,200,33,129,227,45,160,63,118,123,202];function Pm(P){let L=P;return()=>(L=(L*1664525+1013904223)%4294967296,L/4294967296)}function Sm(P){let L=[...xm],H=Pm(P);for(let Y=L.length-1;Y>0;Y--){let Z=Math.floor(H()*(Y+1)),oe=L[Y];L[Y]=L[Z],L[Z]=oe}return L}function Rm(P,L=0){if(!Dn())return"";let H=Sm(L);return`\x1B[38;5;${H[P%H.length]}m`}function Ca(P,L,H=0){if(!Dn())return`"${P}"`;return`${Rm(L,H)}"${P}"${Cm}`}function Or(P){return P==="default"?"built-in default":`${P} policy`}var Em=new RegExp("\x1B\\[[0-9;]*m","g"),Zo=(P)=>P.replace(Em,"").length;function Zn(P){let L=(P.headers??P.rows[0]??[]).map((se,me)=>{let he=Math.max(...P.rows.map((ke)=>Zo(ke[me]??"")));return Math.max(Zo(se),he)}),H=(se,me)=>se+" ".repeat(Math.max(0,me-Zo(se))),Y=(se,me)=>me[0]+L.map((he)=>se.repeat(he+2)).join(me[1])+me[2],Z=(se)=>`│ ${se.map((me,he)=>H(me,L[he]??0)).join(" │ ")} │`,oe=P.headers?[`   ${Z(P.headers)}`,`   ${Y("─",["├","┼","┤"])}`]:[];return[`   ${Y("─",["┌","┬","┐"])}`,...oe,...P.rows.map((se)=>`   ${Z(se)}`),`   ${Y("─",["└","┴","┘"])}`].join(`
`)}function xa(P){let L=[];L.push("Hook Integration"),L.push(Tm(P));let H=[],Y=[];for(let Z of P){let oe=cn(Z.platform);if(Z.errors&&Z.errors.length>0)for(let se of Z.errors)if(Z.configured)H.push({platform:oe,message:se});else Y.push({platform:oe,message:se})}for(let Z of H)L.push(`   Warning (${Z.platform}): ${Z.message}`);for(let Z of Y)L.push(en.red(`   Error (${Z.platform}): ${Z.message}`));return L.join(`
`)}function Tm(P){let L=["Platform","Discovery","Configuration","Inspection"],H=P.map((Y)=>{let Z=cn(Y.platform);if(Y.inspectionStatus==="not-inspected"){let he=en.dim("Not inspected");return[Z,he,he,he]}let oe=Y.detected?en.green("Detected"):Y.inspectionStatus==="failed"?en.red("Unknown"):en.dim("Not detected"),se=Y.configured?en.green("Configured"):Y.detected?en.yellow("Not configured"):Y.inspectionStatus==="failed"?en.red("Unknown"):en.dim("Not applicable"),me=Y.inspectionStatus==="verified"?en.green("Verified"):Y.inspectionStatus==="failed"?en.red("Failed"):en.dim("Not applicable");return[Z,oe,se,me]});return Zn({headers:L,rows:H})}function Pa(P){let H=["Guard Engine Verification",`   Synthetic self-test: ${P.failed>0?en.red(`${P.passed}/${P.total} FAIL`):en.green(`${P.passed}/${P.total} passed`)}`],Y=P.results.filter((Z)=>!Z.passed);if(Y.length>0){H.push(""),H.push(en.red("   Failures:"));for(let Z of Y)H.push(en.red(`   • ${Z.description}`)),H.push(en.red(`     expected ${Z.expected}, got ${Z.actual}`))}return H.join(`
`)}function Am(P){if(P.length===0)return"   (no custom rules)";let L=["Source","Name","Command","Block Args"],H=P.map((Y)=>[Y.source,Y.name,Y.subcommand?`${Y.command} ${Y.subcommand}`:Y.command,Y.blockArgs.join(", ")]);return Zn({headers:L,rows:H})}function Sa(P){let L=[];if(L.push("Configuration"),L.push(_m(P.userConfig,P.projectConfig)),L.push(""),P.effectiveRules.length>0)L.push(`   Effective rules (${P.effectiveRules.length} total):`),L.push(Am(P.effectiveRules));else L.push("   Effective rules: (none - using built-in rules only)");return L.join(`
`)}function _m(P,L){let H=["Scope","Status"],Y=(oe)=>{if(!oe.exists)return en.dim("N/A");if(!oe.valid)return en.red(`Invalid (${oe.errors?.[0]??"unknown error"})`);return en.green("Configured")},Z=[["User",Y(P)],["Project",Y(L)]];return Zn({headers:H,rows:Z})}function Ra(P){let L=[];return L.push("Environment"),L.push(Im(P)),L.join(`
`)}function Ea(P){let L=P.effectiveSafety.policyScopes,H=["Effective Safety",`   Selected preset: ${P.effectiveSafety.selectedPreset}${L?` (${Or(L.levelScope)})`:""}`,`   Effective: ${P.effectiveSafety.level}`],Y=[["fail_closed","fail_closed"],["paranoid_rm","paranoid_rm"],["paranoid_interpreters","paranoid_interpreters"]];for(let[Z,oe]of Y){let se=P.effectiveSafety.capabilities[Z],me=se.enabled?en.green("ON"):en.dim("OFF"),he=se.sources.length>0?` (${se.sources.join(", ")})`:"";H.push(`   ${oe}: ${me} via ${se.source}${he}`)}if(L&&L.weakenings.length>0){H.push(`   Project policy deltas${L.weakeningsIgnored?" (ignored)":""}:`);for(let Z of L.weakenings)H.push(`      ${Z}`)}H.push(`   Stored rule customizations: ${P.effectiveSafety.ruleCounts.stored}`),H.push(`   Effective rule customizations: ${P.effectiveSafety.ruleCounts.effective}`);for(let[Z,oe]of Object.entries(P.effectiveSafety.ruleOverrides))H.push(`   ${Z}: ${oe}`);return H.join(`
`)}function Ta(P){let L=["Findings"];if(P.length===0)return L.push("   No findings from inspected doctor facts."),L.join(`
`);for(let H of P){let Y=`[${H.severity.toUpperCase()}] ${H.checkId}: ${gn(H.title)}`,Z=H.severity==="error"?en.red:H.severity==="warning"?en.yellow:en.blue;if(L.push(`   ${Z(Y)}`),L.push(`      ${gn(H.detail)}`),H.path)L.push(`      Path: ${gn(H.path)}`);if(H.fixHint)L.push(`      Fix: ${gn(H.fixHint)}`)}return L.join(`
`)}function Im(P){let L=["Variable","Status","Legacy"],H=P.map((Y)=>{let Z=Y.isSet?en.green("✓"):en.dim("✗"),oe=Y.legacyName&&Y.legacyIsSet?`${Y.legacyName} ${en.green("✓")}`:Y.legacyName??"";return[Y.name,Z,oe]});return Zn({headers:L,rows:H})}function Aa(P){let L=[];if(P.totalBlocked===0)L.push("Recent Activity"),L.push("   No blocked commands in the last 7 days"),L.push("   Tip: This is normal for new installations");else L.push(`Recent Activity · last 7 days (${P.totalBlocked} blocked / ${P.sessionCount} sessions)`),L.push(Om(P.recentEntries));if(P.unreadable>0)L.push(`   Warning: ${P.unreadable} audit log ${P.unreadable===1?"source":"sources"} could not be read; this summary is incomplete`);return L.join(`
`)}function Om(P){let L=["Time","Command"],H=P.map((Y)=>{let Z=gn(Y.command.replace(/\r\n|\r|\n/g," ↵ ").replace(/\t/g," ")),oe=Z.length>40?`${Z.slice(0,37)}...`:Z;return[Y.relativeTime,oe]});return Zn({headers:L,rows:H})}function _a(P){let L=[];if(L.push("Update Check"),P.latestVersion===null&&!P.error)return L.push($r([["Status",en.dim("Skipped")],["Installed",P.currentVersion]])),L.join(`
`);if(P.error)return L.push($r([["Status",`${en.yellow("⚠")} Error`],["Installed",P.currentVersion],["Error",en.dim(P.error)]])),L.join(`
`);if(P.updateAvailable)return L.push($r([["Status",`${en.yellow("⚠")} Update Available`],["Current",P.currentVersion],["Latest",en.green(P.latestVersion??"")]])),L.push(""),L.push("   Run: bunx cc-safety-net@latest doctor"),L.push("   Or:  npx cc-safety-net@latest doctor"),L.join(`
`);return L.push($r([["Status",`${en.green("✓")} Up to date`],["Version",P.currentVersion]])),L.join(`
`)}function $r(P){return Zn({rows:P})}function Ia(P){let L=[];return L.push("System Info"),L.push($m(P)),L.join(`
`)}function $m(P){let L=["Component","Version"],H=(oe)=>{if(oe===null)return en.dim("not found");return oe},Z=[{label:"cc-safety-net",value:P.version},...Er.map((oe)=>({label:cn(oe),value:P.versions[oe]??null})),{label:"Node.js",value:P.nodeVersion},{label:"npm",value:P.npmVersion},{label:"Bun",value:P.bunVersion},{label:"Platform",value:P.platform}].map((oe)=>[oe.label,H(oe.value)]);return Zn({headers:L,rows:Z})}function Oa(P){if(P.findings.length===0)return en.green(`
No findings from inspected doctor facts.`);let L={error:P.findings.filter((oe)=>oe.severity==="error").length,warning:P.findings.filter((oe)=>oe.severity==="warning").length,info:P.findings.filter((oe)=>oe.severity==="info").length},H=["error","warning","info"].filter((oe)=>L[oe]>0).map((oe)=>`${L[oe]} ${oe}`),Y=P.findings.length===1?"finding":"findings",Z=`
${P.findings.length} ${Y}: ${H.join(", ")}.`;if(L.error>0)return en.red(Z);if(L.warning>0)return en.yellow(Z);return en.blue(Z)}import{lstatSync as Dm}from"node:fs";import{dirname as Xo}from"node:path";function Qo(P,L){try{let H=Dm(L);if(H.isSymbolicLink())return{kind:P,path:L,status:"unsafe",issues:["symlink"]};if(!H.isDirectory())return{kind:P,path:L,status:"unsafe",issues:["not-directory"]};if(process.platform==="win32"||typeof process.getuid!=="function")return{kind:P,path:L,status:"unknown",issues:[]};let Y=[...H.uid!==process.getuid()?["ownership"]:[],...(H.mode&18)!==0?["permissions"]:[]];return{kind:P,path:L,status:Y.length>0?"unsafe":"safe",issues:Y}}catch(H){if(typeof H==="object"&&H!==null&&"code"in H&&H.code==="ENOENT")return{kind:P,path:L,status:"not-applicable",issues:[]};return{kind:P,path:L,status:"unknown",issues:[]}}}function $a(P,L){let H=G(P);return{directories:[Qo("policy",Xo(Xo(L))),Qo("config",Xo(L)),...H?[Qo("audit",H)]:[{kind:"audit",status:"unknown",issues:[]}]]}}import{spawn as Nm}from"node:child_process";import{existsSync as Da}from"node:fs";import{delimiter as Lm,extname as jm,join as Fm}from"node:path";import{stripVTControlCharacters as Na}from"node:util";var ja="2.6.16",Hm=5000,Mm="_CC_SAFETY_NET_TEST_SPAWN_PLATFORM";function pn(){return ja}function ei(P,L){let H=P[L];if(H)return H;let Y=Object.keys(P).find((Z)=>Z.toLowerCase()===L.toLowerCase()&&!!P[Z]);return Y?P[Y]:H}function Um(P){return(ei(P,"PATHEXT")||".COM;.EXE;.BAT;.CMD").split(";").filter((L)=>L.length>0)}function Bm(P,L){let H=jm(P)?[P]:[...Um(L).map((Y)=>`${P}${Y}`),P];if(P.includes("/")||P.includes("\\"))return H.find((Y)=>Da(Y))??P;return(ei(L,"PATH")??"").split(Lm).flatMap((Y)=>H.map((Z)=>Fm(Y,Z))).find((Y)=>Da(Y))??P}function La(P){if(!/[\s"&|<>^]/.test(P))return P;return`"${P.replace(/"/g,'""')}"`}function Xn(P,L){let[H,...Y]=P,Z=L[Mm]==="win32"?"win32":process.platform;if(!H||Z!=="win32")return{cmd:H??"",args:Y};let oe=Bm(H,L);if(!/\.(?:bat|cmd)$/i.test(oe))return{cmd:oe,args:Y};return{cmd:ei(L,"COMSPEC")??"cmd.exe",args:["/d","/c",["call",La(oe),...Y.map(La)].join(" ")]}}var Ft=async(P,L=Hm)=>{let H=await Gm(P,{timeoutMs:L});if(H.code!==0)return null;return Na(H.stdout).trim()||Na(H.stderr).trim()||null};function Gm(P,L){let[H,...Y]=P;if(!H)return Promise.resolve({code:null,stdout:"",stderr:""});return new Promise((Z)=>{try{let oe=Xn([H,...Y],process.env),se=Nm(oe.cmd,oe.args,{stdio:["ignore","pipe","pipe"]}),me=!1,he="",ke="";se.stdout.on("data",(_e)=>{he+=_e.toString()}),se.stderr.on("data",(_e)=>{ke+=_e.toString()});let Pe=(_e)=>{if(me)return;me=!0,clearTimeout(Te),Z(_e)},Te=setTimeout(()=>{se.kill(),Pe({code:null,stdout:he,stderr:ke})},L.timeoutMs);se.on("close",(_e)=>{Pe({code:_e,stdout:he,stderr:ke})}),se.on("error",()=>{Pe({code:null,stdout:he,stderr:ke})})}catch{Z({code:null,stdout:"",stderr:""})}})}function Dr(P){if(!P)return null;let L=/Claude Code\s+(\d+\.\d+\.\d+)/i.exec(P);if(L)return L[1]??null;let H=/v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)/i.exec(P);if(H)return H[1]??null;return P.split(`
`)[0]?.trim()||null}async function Nr(P,L=Ft,H=process.cwd()){let Y=Promise.all(Rn.map(async(Te)=>[Te.id,Dr(await L([...Te.probeCommand]))])),[Z,oe,se,me,he,ke,Pe]=await Promise.all([Y,Y.then(async(Te)=>{let _e=Te.find(([We])=>We==="opencode")?.[1];if(!_e?.startsWith("2.")||!P(_e))return null;let Ae=["--param",`location[directory]=${H}`],Le=["opencode","api","integration.list",...Ae];return await L(Le,30000),L(["opencode","api","plugin.list",...Ae],30000)}),L(["codex","plugin","list"],30000),L(["amp","plugins","list"],30000),L(["node","--version"]),L(["npm","--version"]),L(["bun","--version"])]);return{version:ja,versions:Object.fromEntries(Z),codexPluginListOutput:se,ampPluginListOutput:me,openCodePluginListOutput:oe,nodeVersion:Dr(he),npmVersion:Dr(ke),bunVersion:Dr(Pe),platform:`${process.platform} ${process.arch}`}}function ni(P,L){if(L==="dev")return!1;let H=P.split(".").map(Number),Y=L.split(".").map(Number),[Z=0,oe=0,se=0]=H,[me=0,he=0,ke=0]=Y;if(Z!==me)return Z>me;if(oe!==he)return oe>he;return se>ke}async function Bn(){let P=pn(),L=new AbortController,H=setTimeout(()=>L.abort(),3000);try{let Y=await fetch("https://registry.npmjs.org/cc-safety-net/latest",{signal:L.signal});if(!Y.ok)return{currentVersion:P,latestVersion:null,updateAvailable:!1,error:`npm registry returned ${Y.status}`};let Z=await Y.json(),oe=ni(Z.version,P);return{currentVersion:P,latestVersion:Z.version,updateAvailable:oe}}catch(Y){return{currentVersion:P,latestVersion:null,updateAvailable:!1,error:Y instanceof Error?Y.message:"Network error"}}finally{clearTimeout(H)}}import*as Va from"node:readline";var Ua=(P)=>`\x1B[${P}B`,qm=(P)=>`\x1B[${P}A`;var Fa=["░","▒","▓","╱","╲","┃","━","┏","┓","┗","┛","╋"];function Vm(P){return new Promise((L)=>setTimeout(L,P))}function Km(P,L,H){if(!H)return L(P);if(H.aborted)return Promise.resolve();return new Promise((Y,Z)=>{let oe=()=>H.removeEventListener("abort",se),se=()=>{oe(),Y()};H.addEventListener("abort",se,{once:!0}),L(P).then(()=>{oe(),Y()},(me)=>{oe(),Z(me)})})}function Lr(P){return Math.max(0,Math.min(1,P))}function Ht(P){return Math.max(0,Math.min(255,Math.round(P)))}function ti(P){return P<=0.0031308?12.92*P:1.055*P**0.4166666666666667-0.055}function Jm(P,L,H){let Y=H*Math.PI/180,Z=L*Math.cos(Y),oe=L*Math.sin(Y),se=(P+0.3963377774*Z+0.2158037573*oe)**3,me=(P-0.1055613458*Z-0.0638541728*oe)**3,he=(P-0.0894841775*Z-1.291485548*oe)**3;return{blue:Ht(ti(Lr(-0.0041960863*se-0.7034186147*me+1.707614701*he))*255),green:Ht(ti(Lr(-1.2684380046*se+2.6097574011*me-0.3413193965*he))*255),red:Ht(ti(Lr(4.0767416621*se-3.3077115913*me+0.2309699292*he))*255)}}function ri(P,L){let H=(L*P*180/Math.PI%360+360)%360;return Jm(0.72,0.15,H)}function Ba(P,L=0.1){let H=ri(L,P);return`\x1B[38;2;${H.red};${H.green};${H.blue}m`}function zm(P,L){return{blue:Ht(P.blue+(255-P.blue)*L),green:Ht(P.green+(255-P.green)*L),red:Ht(P.red+(255-P.red)*L)}}function Ga(P,L,H){let Y=Math.imul(P+2654435769,2246822507)^Math.imul(L+3266489909,668265263)^Math.imul(H+374761393,2654435761),Z=Y^Y>>>15,oe=Math.imul(Z,739982445),se=oe^oe>>>12,me=Math.imul(se,695872825);return((me^me>>>15)>>>0)/4294967296}function Wm(P,L,H){let Y=Math.floor(Ga(P,L,H)*Fa.length);return Fa[Y]??"░"}function Ha(P){let L=Lr(P);return L*L*L*(L*(L*6-15)+10)}function Ym(P){if(P.length===0)return"";let L=[],H=!1,Y="";for(let Z of P){let oe=`${Z.red};${Z.green};${Z.blue}`;if(Z.bold!==H)L.push(Z.bold?"\x1B[1m":"\x1B[22m"),H=Z.bold;if(oe!==Y)L.push(`\x1B[38;2;${oe}m`),Y=oe;L.push(Z.character)}return`${L.join("")}\x1B[22m\x1B[39m`}function Zm(P,L,H,Y,Z){return P.map((oe,se)=>({...ri(H,Y+L+se/Z),bold:!1,character:oe}))}function Xm(P,L,H,Y,Z,oe,se,me){let he=Math.max(1,Y*0.75),ke=Math.min(1,H/he),Pe=Z*Ha(ke),Te=Math.max(0,(H-he)/Math.max(1,Y-he)),_e=(1-Ha(H/Y))*me*2,Ae=0.35*Math.max(0,1-Te*2),Le=ke>=1,We=Math.min(P.length,Math.ceil(Pe+2+1));return P.slice(0,We).map((Fe,Ze)=>{let tn=ri(oe,se+L+Ze/me+_e),on=Ze+Ga(L,Ze,7919)*2-1;if(on>Pe+2)return{...tn,bold:!1,character:" "};let ln=Pe-on,nn=0.8*Math.exp(-(ln*ln)/12.5),sn=Math.min(0.9,nn+Ae),Pn=!Le&&on>Pe-4;return{...zm(tn,sn),bold:sn>0.3,character:Pn?Wm(L,Ze,H):Fe}})}function Ma(P){return`\x1B[?2026h${P.map((L,H)=>`\x1B8${H>0?Ua(H):""}${Ym(L)}`).join("")}\x1B[?2026l`}async function oi(P,L={}){if(!P)return;let H=L.output??process.stdout,Y=L.sleep??Vm,Z=L.seed??0,oe=P.split(`
`).map((Pe)=>Array.from(Pe)),se=Math.max(...oe.map((Pe)=>Pe.length)),me=12000*oe.filter((Pe)=>Pe.length>0).length/40,he=se>0?Math.max(1,Math.ceil(me/16.666666666666668)):0,ke=he>0?me/he:0;H.write(`\x1B[?25l${oe.length>1?`${`
`.repeat(oe.length-1)}${qm(oe.length-1)}`:""}\x1B7`);try{for(let Pe=1;Pe<=he;Pe+=1){if(L.signal?.aborted)break;H.write(Ma(oe.map((Te,_e)=>Xm(Te,_e,Pe,he,se,0.1,Z,3)))),await Km(ke,Y,L.signal)}}finally{if(H.write(Ma(oe.map((Pe,Te)=>Zm(Pe,Te,0.1,Z,3)))),H.write("\x1B8"),oe.length>1)H.write(Ua(oe.length-1));H.write(`
\x1B[0m\x1B[?25h`)}}var qa=["┏━┛┏━┛  ┏━┛┏━┃┏━┛┏━┛━┏┛┃ ┃  ┏━ ┏━┛━┏┛","┃  ┃    ━━┃┏━┃┏━┛┏━┛ ┃ ━┏┛  ┃ ┃┏━┛ ┃ ","━━┛━━┛  ━━┛┛ ┛┛  ━━┛ ┛  ┛   ┛ ┛━━┛ ┛ "].join(`
`);function Qm(P){return Boolean(P.isTTY)}async function nr(P={}){let L=P.output??process.stdout;if(!Qm(L))return;let H=P.input??process.stdin,Y={output:L,seed:P.seed??Math.random()*8192,sleep:P.sleep};if(!H.isTTY||typeof H.setRawMode!=="function"){await oi(qa,Y);return}let Z=new AbortController,oe=H.readableFlowing===!0,se=H.isRaw===!0,me=!1,he=(ke,Pe)=>{if(Pe.ctrl&&Pe.name==="c")me=!0;if(me||Pe.name==="return"||Pe.name==="enter")Z.abort()};Va.emitKeypressEvents(H),H.on("keypress",he),H.setRawMode(!0),H.resume();try{await oi(qa,{...Y,signal:Z.signal})}finally{if(H.off("keypress",he),H.setRawMode(se),!oe)H.pause()}if(!me)return;if(P.onInterrupt){P.onInterrupt();return}process.kill(process.pid,"SIGINT")}import{createHash as rg}from"node:crypto";import{existsSync as Ja}from"node:fs";import{dirname as jr,join as za}from"node:path";import{dirname as Ka,join as eg}from"node:path";var ng="rule.lock";function tg(P){return eg(Ka(P),ng)}function hn(P,L){let H=L.global?L.userConfigPath??z(P,L):L.projectConfigPath??A(L.cwd??process.cwd()),Y=L.global?at(P,L):ct(H,L.cwd??process.cwd()),Z=tg(H);return{configDir:Ka(H),configPath:H,lockPath:Z,filesystemScope:Y,configTarget:i(Y,H),lockTarget:i(Y,Z)}}var og="`cc-safety-net rule sync` is deprecated: rulebooks are live files that need no synchronization. This run only migrates the lock and cache an earlier version left behind.",ig="cache",sg="rulebooks";function Wa(P,L={}){let H=hn(P,L),Y=i(H.filesystemScope,Za(H.configDir)),Z=r(H.lockTarget);if(console.log(og),Z===null&&!Ja(Y.path))return console.log(`No v2 lock or cache leftovers found in ${jr(H.configDir)}; nothing to migrate.`),0;let oe=ug(Z),se=d(H.configTarget);if(!se.config&&(r(H.configTarget)!==null||oe.size>0))return console.error(`Cannot migrate: the rules config in ${jr(H.configDir)} is missing or unreadable while v2 leftovers remain. Restore rule.json, then re-run rule sync.`),1;let me=se.config?.rules??[];for(let he of me.flatMap((ke)=>ag(ke,oe,H,Y,L.global===!0)))console.log(he);return W(H.lockTarget),wt(Y),console.log(`Removed the v2 lock and cache under ${jr(H.configDir)}.`),0}function Ya(P,L){return[...new Set([{cwd:L},{cwd:L,global:!0}].flatMap((H)=>{let Y=hn(P,H);return[Y.lockPath,Za(Y.configDir)]}))].filter((H)=>Ja(H))}function ag(P,L,H,Y,Z){if(!C(P))return[];let oe=M(P).name,se=i(H.filesystemScope,F(H.configDir,oe)),me=r(se);if(me!==null&&lg(me,oe))return[];let he=L.get(P),ke=he?cg(he,oe,Y.path,H.filesystemScope):null;if(ke===null)return[`Could not migrate ${P} from the v2 cache. Run \`cc-safety-net rule update ${P}${Z?" --global":""}\` to vendor it.`];if(h(se,ke),me!==null)return[`Restored ${P} from the v2 cache over an invalid file.`];return[`Vendored ${P} from the v2 cache.`]}function lg(P,L){let H=Ce(P);return!("problem"in H)&&H.rulebook.name===L}function cg(P,L,H,Y){let Z=za(H,sg,`${dg(P)}--${P.digest.replace("sha256:","").slice(0,12)}`,ve),oe=r(i(Y,Z));if(oe===null||mg(oe)!==P.digest)return null;let se=Ce(oe);if("problem"in se||se.rulebook.name!==L)return null;return oe}function Za(P){return za(jr(P),ig)}function dg(P){return([P.owner,P.repo,P.display_ref,P.name].every((Y)=>typeof Y==="string"&&Y!=="")?`${P.owner}/${P.repo}#${P.display_ref}/${P.name}`:P.spec).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"rulebook"}function ug(P){let L=P===null?null:fg(P),H=Xa(L)&&Array.isArray(L.rulebooks)?L.rulebooks:[];return new Map(H.filter(pg).map((Y)=>[Y.spec,Y]))}function pg(P){return Xa(P)&&typeof P.spec==="string"&&typeof P.digest==="string"}function Xa(P){return!!P&&typeof P==="object"}function fg(P){try{return JSON.parse(P)}catch{return null}}function mg(P){return`sha256:${rg("sha256").update(P).digest("hex")}`}var Qa="\r\x1B[2K",gg="\x1B[?25l",yg="\x1B[39m",hg="\x1B[?25h",vg=100,bg=0.55,wg=80,el=["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];function kg(P){return new Promise((L)=>setTimeout(L,P))}async function Fr(P,L={}){let H=L.output??process.stdout;if(!H.isTTY)return P;let Y=L.sleep??kg,Z=!1,oe=P.then((me)=>(Z=!0,me),(me)=>{throw Z=!0,me});if(await Promise.race([oe.then(()=>!0),Y(vg).then(()=>!1)]))return oe;H.write(gg);try{for(let me=0;!Z;me+=1)H.write(`${Qa}${Ba(me*bg)}${el[me%el.length]}${yg} ${L.loadingMessage??"Loading…"}`),await Promise.race([oe,Y(wg)]);return await oe}finally{H.write(`${Qa}${hg}`)}}async function tr(P,L,H,Y={}){let Z=L();if(P)await H();if(P&&Z.ready)await Fr(Z.ready,Y);return Z.finish()}import{stripVTControlCharacters as Cg}from"node:util";var Hr="amp plugins list",xg=/^\s*[✓✗]\s+cc-safety-net(?:\.ts)?\s+\(User Plugins\)\s+(\S+)\s*$/;function nl(P){if(!P.ampPluginListOutput)return{platform:"amp",status:"n/a"};let L=Cg(P.ampPluginListOutput).split(`
`).map((H)=>xg.exec(H)?.[1]).find((H)=>H!==void 0);if(!L)return{platform:"amp",status:"n/a"};if(L!=="active")return{platform:"amp",status:"disabled",method:Hr,configPath:Hr,errors:[`Amp personal plugin cc-safety-net is ${L}; run "plugins: reload" in Amp or reinstall with install --amp`]};return{platform:"amp",status:"configured",method:Hr,configPath:Hr}}import{existsSync as _g,readFileSync as Ig}from"node:fs";import{isAbsolute as yP,join as Ag}from"node:path";function rr(P){return Ag(P,".gemini","config","hooks.json")}var rl=new Map([["run_command","auto"]]),ol="manage_task";var Og=/cc-safety-net\s+hook\s+(?:[^\s]+\s+)*(?:--agy-cli|-ac)(\s|["']|$)/;function $g(P){if(!P||typeof P!=="object"||Array.isArray(P))return[];return Object.values(P).flatMap((L)=>{if(!L||typeof L!=="object"||Array.isArray(L))return[];let H=L,Y=H.PreToolUse;if(!Array.isArray(Y))return[];return Y.flatMap((Z)=>{if(!Z||typeof Z!=="object"||Array.isArray(Z))return[];let oe=Z.hooks;if(!Array.isArray(oe))return[];return oe.flatMap((se)=>{if(!se||typeof se!=="object"||Array.isArray(se))return[];let me=se.command;if(typeof me!=="string"||!Og.test(me))return[];return[{command:me,enabled:H.enabled!==!1}]})})})}function il(P){let L=rr(P.environment.home);if(!_g(L))return{platform:"antigravity-cli",status:"n/a",configPath:L};let H;try{H=$g(JSON.parse(Ig(L,"utf-8")))}catch(Y){return{platform:"antigravity-cli",status:"n/a",configPath:L,errors:[`Failed to parse Antigravity hooks config ${L}: ${Y instanceof Error?Y.message:String(Y)}`]}}if(H.some((Y)=>Y.enabled))return{platform:"antigravity-cli",status:"configured",method:"hook config",configPath:L};if(H.length>0)return{platform:"antigravity-cli",status:"disabled",method:"hook config",configPath:L};return{platform:"antigravity-cli",status:"n/a",configPath:L}}import{existsSync as Fg}from"node:fs";import{join as Ln}from"node:path";import{existsSync as Dg,lstatSync as Ng,readFileSync as Lg}from"node:fs";import{join as jg}from"node:path";function vn(P,L=(H)=>H){if(!Dg(P))return{kind:"missing"};try{return{kind:"ok",value:JSON.parse(L(Lg(P,"utf-8")))}}catch{return{kind:"unreadable"}}}function Nn(P,L){if(P==="~")return L;if(P.startsWith("~/")||P.startsWith("~\\"))return jg(L,P.slice(2));return P}function dn(P){try{return Ng(P)}catch{return}}function Gr(P,L){let H=dn(L);if(!H)return{platform:P,status:"n/a",configPath:L};if(!H.isSymbolicLink()&&H.isDirectory())return;return{platform:P,status:"n/a",configPath:L,errors:[`${L} is a symlink or not a directory; move or remove it before installing`]}}function Xe(P,L){return typeof P==="object"&&P!==null?P[L]:void 0}var qr="cc-safety-net@cc-marketplace";function Vr(P){return P.env.get("CLAUDE_CONFIG_DIR")||Ln(P.home,".claude")}function sl(P){return Ln(P.env.get("CLAUDE_CODE_PLUGIN_CACHE_DIR")||Ln(Vr(P),"plugins"),"installed_plugins.json")}function al(P,L){let H=Xe(Xe(P,"plugins"),L);return Array.isArray(H)&&H.length>0}function Kr(P,L){let H=vn(sl(P));return H.kind==="ok"&&al(H.value,L)}function si(P){return ll(sl(P),Ln(Vr(P),"settings.json"))}function ll(P,L){let H=vn(P);if(H.kind==="unreadable")return{platform:"claude-code",status:"not-inspected"};if(H.kind==="missing")return{platform:"claude-code",status:"n/a"};if(!al(H.value,qr))return{platform:"claude-code",status:"n/a"};let Y=vn(L);if(Y.kind==="unreadable")return{platform:"claude-code",status:"not-inspected"};if(!(Y.kind==="ok"&&Xe(Xe(Y.value,"enabledPlugins"),qr)===!0))return{platform:"claude-code",status:"disabled",method:"plugin config",configPath:L,errors:[`${qr} is installed but not enabled in Claude Code`]};return{platform:"claude-code",status:"configured",method:"plugin config",configPath:P}}function cl(P){let L=Ln(P.home,".claude"),H=Ln(L,"plugins","installed_plugins.json");if(ll(H,Ln(L,"settings.json")).status!=="configured")return;let Y=vn(H),Z=Y.kind==="ok"?Xe(Xe(Y.value,"plugins"),qr):void 0,oe=(Array.isArray(Z)?Z:[]).filter((ke)=>Xe(ke,"scope")==="user").map((ke)=>Xe(ke,"installPath")).find((ke)=>typeof ke==="string");if(!oe)return;let se=Ln(oe,".cursor-plugin","plugin.json"),me=vn(se),he=me.kind==="ok"?Xe(me.value,"hooks"):void 0;return typeof he==="string"&&Fg(Ln(oe,he))?se:void 0}function dl(P){return si(P.environment)}var ul="Start Codex, open `/hooks`, select the cc-safety-net PreToolUse hook, and press `t` to trust it.";function pl(P){if(!P.codexPluginListOutput)return{platform:"codex",status:"n/a"};let L=P.codexPluginListOutput.split(`
`).find((H)=>H.includes("https://github.com/kenryu42/cc-safety-net.git"));if(!L)return{platform:"codex",status:"n/a"};if(!L.includes("installed,"))return{platform:"codex",status:"n/a"};if(!L.includes("installed, enabled"))return{platform:"codex",status:"disabled",method:"codex plugin list",configPath:"codex plugin list",errors:["Codex plugin line for https://github.com/kenryu42/cc-safety-net.git must contain installed, enabled."]};return{platform:"codex",status:"configured",method:"codex plugin list",configPath:"codex plugin list",errors:["Codex runs only trusted hooks, and doctor cannot check trust. Start Codex, open `/hooks`, select the cc-safety-net PreToolUse hook, and press `t` to trust it."]}}import{existsSync as Yr,readdirSync as Hg,readFileSync as Mg}from"node:fs";import{join as wn}from"node:path";function yn(P){let L="",H=0,Y=!1,Z=!1,oe=-1;while(H<P.length){let se=P[H],me=P[H+1];if(Z){L+=se,Z=!1,H++;continue}if(se==='"'&&!Y){Y=!0,oe=-1,L+=se,H++;continue}if(se==='"'&&Y){Y=!1,L+=se,H++;continue}if(se==="\\"&&Y){Z=!0,L+=se,H++;continue}if(Y){L+=se,H++;continue}if(se==="/"&&me==="/"){while(H<P.length&&P[H]!==`
`)H++;continue}if(se==="/"&&me==="*"){H+=2;while(H<P.length-1){if(P[H]==="*"&&P[H+1]==="/"){H+=2;break}H++}continue}if(se===","){oe=L.length,L+=se,H++;continue}if(se==="}"||se==="]"){if(oe!==-1){let he=L.slice(oe+1);if(/^\s*$/.test(he))L=L.slice(0,oe)+he}oe=-1,L+=se,H++;continue}if(!/\s/.test(se))oe=-1;L+=se,H++}return L}function ml(P,L,H){let Y=L+1,Z=!1;while(Y<P.length){if(Z){Z=!1,Y++;continue}if(P[Y]==="\\"){Z=!0,Y++;continue}if(P[Y]==='"')return Y+1;Y++}throw Error(H)}function li(P,L,H){let Y=P[L],Z=Y==="["?"]":"}",oe=0,se=L;while(se<P.length){let me=H.skipComment?.(P,se)??se;if(me!==se){se=me;continue}if(P[se]==='"'){se=ml(P,se,H.stringError);continue}if(P[se]===Y)oe++;if(P[se]===Z){if(oe--,oe===0)return se}se++}throw Error(H.bracketError)}function gl(P,L){let H=P.lastIndexOf(`
`,L)+1;return/^[ \t]*/.exec(P.slice(H))?.[0]??""}function yl(P,L){let H=L.end+(/^\s*/.exec(P.slice(L.end))?.[0].length??0);if(P[H]===","){let se=P[H+1]===`
`?H+2:H+1;return`${P.slice(0,L.start)}${P.slice(se)}`}let Y=P.slice(0,L.start).search(/\s*$/)-1;if(P[Y]!==",")return`${P.slice(0,L.start)}${P.slice(L.end)}`;let Z=P.lastIndexOf(`
`,Y-1),oe=Z!==-1&&/^\s*$/.test(P.slice(Z+1,Y))?Z:Y;return`${P.slice(0,oe)}${P.slice(L.end)}`}function ai(P,L){if(P.startsWith("//",L)){let H=P.indexOf(`
`,L+2);return H===-1?P.length:H+1}if(P.startsWith("/*",L)){let H=P.indexOf("*/",L+2);return H===-1?P.length:H+2}return L}function fl(P,L){let H=L;while(H<P.length){if(/\s/.test(P[H]??"")){H++;continue}let Y=ai(P,H);if(Y===H)return H;H=Y}return H}function hl(P,L,H){let Y=0,Z=0;while(Z<P.length){let oe=ai(P,Z);if(oe!==Z){Z=oe;continue}if(P[Z]==='"'){let se=ml(P,Z,H.stringError);if(Y===1&&JSON.parse(P.slice(Z,se))===L){let me=fl(P,se),he=fl(P,me+1);if(P[me]===":"&&P[he]==="[")return{start:he,end:li(P,he,{skipComment:ai,...H})}}Z=se;continue}if(P[Z]==="{"||P[Z]==="[")Y++;if(P[Z]==="}"||P[Z]==="]")Y--;Z++}return}var An="cc-safety-net@cc-marketplace",Jr=["cc-marketplace","cc-safety-net"],vl=["_direct","copilot-safety-net"],bl=["cc-marketplace","safety-net"],wl="safety-net@cc-marketplace";function zr(P,L){let H=L.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(^|[^a-z0-9-])${H}([^a-z0-9-]|$)`,"m").test(P??"")}function kl(P){return zr(P,"cc-safety-net@cc-marketplace")}function Cl(P){return zr(P,"cc-marketplace")}function xl(P){return zr(P,"copilot-safety-net")}function Pl(P){return zr(P,"safety-net@cc-marketplace")}function Wr(P){if(!P?.includes("cc-safety-net"))return!1;return/(^|\s)hook\s+(?:[^\s]+\s+)*(--copilot-cli|-cp)(\s|$)/.test(P)}function Rl(P,L){if(!P)return null;let H=P.match(/(\d+)\.(\d+)\.(\d+)/);if(!H)return null;let Y=[Number(H[1]),Number(H[2]),Number(H[3])];for(let Z=0;Z<L.length;Z++){let oe=Y[Z]??0,se=L[Z]??0;if(oe!==se)return oe>se}return!0}function Ug(P){return Rl(P,[0,0,422])}function Bg(P){return Rl(P,[1,0,8])}function sr(P){return P.env.get("COPILOT_HOME")||wn(P.home,".copilot")}function El(P){return P.disableAllHooks!==!0&&Tl(P)}function Tl(P){return(P.hooks?.preToolUse??[]).some((H)=>{if(H.type!==void 0&&H.type!=="command")return!1;return Wr(H.command)||Wr(H.bash)||Wr(H.powershell)||Wr(H.exec&&[H.exec,...H.args??[]].join(" "))})}function or(P){return P===void 0||typeof P==="string"}function Gg(P){return P===void 0||Array.isArray(P)&&P.every((L)=>typeof L==="string")}function qg(P){if(!P||typeof P!=="object"||Array.isArray(P))return!1;let L=P;if(L.disableAllHooks!==void 0&&typeof L.disableAllHooks!=="boolean")return!1;if(L.hooks===void 0)return!0;if(!L.hooks||typeof L.hooks!=="object"||Array.isArray(L.hooks))return!1;let H=L.hooks.preToolUse;if(H===void 0)return!0;return Array.isArray(H)&&H.every((Y)=>Y!==null&&typeof Y==="object"&&!Array.isArray(Y)&&or(Y.type)&&or(Y.command)&&or(Y.bash)&&or(Y.powershell)&&or(Y.exec)&&Gg(Y.args))}function ci(P,L){try{let H=JSON.parse(yn(Mg(P,"utf-8")));if(!qg(H)){L?.push(`Invalid hook config ${P}: hooks.preToolUse must be an array of hook objects`);return}return H}catch(H){L?.push(`Failed to parse ${P}: ${H instanceof Error?H.message:String(H)}`);return}}function Al(P,L){try{return Hg(P).filter((H)=>H.endsWith(".json")).sort((H,Y)=>H.localeCompare(Y))}catch(H){return L?.push(`Failed to read ${P}: ${H instanceof Error?H.message:String(H)}`),[]}}function Vg(P,L){if(!Yr(P))return[];let H=[];for(let Y of Al(P,L)){let Z=wn(P,Y),oe=ci(Z,L);if(oe&&El(oe))H.push(Z)}return H}function ir(P,L){if(!Yr(P))return;let H=ci(P,L);if(!H)return;return{path:P,config:H}}function Sl(P,L,H,Y){if(L){P.push(`GitHub Copilot CLI ${L} does not support ${H}; requires ${Y}+`);return}P.push(`GitHub Copilot CLI version unavailable; skipping ${H} because it requires ${Y}+`)}function Kg(P){for(let L of P){if(L?.config.disableAllHooks===!0)return L.path;if(L?.config.disableAllHooks===!1)return}return}function Jg(P,L,H,Y){let Z=sr(P),oe=wn(L,".github","hooks"),se=wn(Z,"hooks"),me=wn(L,".github","copilot"),he=wn(L,".claude"),ke=Bg(H),Pe=ke===!0?Y:void 0,Te=[ir(wn(me,"settings.local.json"),Pe),ir(wn(me,"settings.json"),Pe),ir(wn(he,"settings.local.json"),Pe),ir(wn(he,"settings.json"),Pe)],_e=ir(wn(Z,"settings.json"),Pe),Ae=[_e?.config.disableAllHooks===!0?void 0:_e];if(ke!==!1){let nn=Kg(Te);if(nn){if(ke===null)Y.push(`GitHub Copilot CLI version unavailable; treating disableAllHooks in ${nn} as active`);return{activeConfigPaths:[],repoInlineSources:Te,disabledBy:nn}}}let Le=Vg(oe,Y),We=Ug(H),Fe=We===!0?Y:void 0,Ze=Yr(se)?Al(se,Fe):[],tn=[];for(let nn of Ze){let sn=wn(se,nn),Pn=ci(sn,Fe);if(Pn&&El(Pn))tn.push(sn)}if(We!==!0&&tn.length>0)Sl(Y,H,`user hook files in ${se}`,"0.0.422"),tn.length=0;let on=[];for(let nn of[...Te,...Ae]){if(!nn)continue;if(!Tl(nn.config))continue;if(ke===!0){on.push(nn);continue}Sl(Y,H,"inline hook definitions in Copilot config files","1.0.8");break}let ln=(nn)=>nn.filter((sn)=>!!sn&&on.includes(sn)).map((sn)=>sn.path);return{activeConfigPaths:[...ln(Te),...Le,...ln(Ae),...tn],repoInlineSources:Te}}function _l(P){let L=[],H=Jg(P.environment,P.cwd,P.copilotCliVersion,L);if(H.disabledBy)return{platform:"copilot-cli",status:"disabled",method:"hook config",configPath:H.disabledBy,configPaths:[H.disabledBy],errors:L.length>0?L:void 0};let Y=sr(P.environment),Z=wn(Y,"installed-plugins",...Jr),oe=Yr(Z),se=wn(Y,"settings.json"),me=vn(se,yn),he=(Ae)=>Xe(Xe(Ae,"enabledPlugins"),An),ke=H.repoInlineSources.find((Ae)=>typeof he(Ae?.config)==="boolean"),Pe=ke??(me.kind==="ok"?{path:se,config:me.value}:void 0);if(oe&&!ke&&me.kind==="unreadable")return{platform:"copilot-cli",status:"not-inspected"};let Te=oe&&Pe!==void 0&&he(Pe.config)===!1;if(Te&&H.activeConfigPaths.length===0)return{platform:"copilot-cli",status:"disabled",method:"plugin config",configPath:Pe.path,errors:[`${An} is installed but not enabled in Copilot CLI`]};let _e=oe&&!Te;if(_e||H.activeConfigPaths.length>0){let Ae=H.activeConfigPaths[0];return{platform:"copilot-cli",status:"configured",method:_e?"plugin config":"hook config",configPath:Ae??(_e?Z:void 0),configPaths:H.activeConfigPaths.length>0?H.activeConfigPaths:void 0,errors:L.length>0?L:void 0}}return{platform:"copilot-cli",status:"n/a",errors:L.length>0?L:void 0}}import{existsSync as hi,readdirSync as ay,readFileSync as ly}from"node:fs";import{join as yi}from"node:path";import{existsSync as mi,mkdirSync as ey,readFileSync as ny,rmSync as ty}from"node:fs";import{dirname as ry,join as Zr}from"node:path";import{existsSync as zg,renameSync as Wg,statSync as Yg,writeFileSync as Zg}from"node:fs";function an(P,L){let H=`${P}.${process.pid}.tmp`;Zg(H,L,zg(P)?{mode:Yg(P).mode&511}:{}),Wg(H,P)}import{spawn as Xg}from"node:child_process";function Qg(P){return P.join(" ")}function di(P,L,H){return[`Failed to run ${Qg(P)}${L===null?"":` (exit ${L})`}.`,H.trim()].filter(Boolean).join(`
`)}function ui(P){let L={stdout:"",stderr:""};return P.stdout.setEncoding("utf-8"),P.stderr.setEncoding("utf-8"),P.stdout.on("data",(H)=>{L.stdout+=H}),P.stderr.on("data",(H)=>{L.stderr+=H}),L}function fn(P,L){return new Promise((H,Y)=>{let Z=Xn([...P],process.env),oe=Xg(Z.cmd,Z.args,{stdio:["ignore","pipe","pipe"]}),se=ui(oe),me=()=>[se.stdout,se.stderr].filter(Boolean).join(`
`),he=L?.timeoutMs??120000,ke=setTimeout(()=>{oe.kill(),Y(Error(di(P,null,`Timed out after ${he}ms.
${me()}`.trim())))},he);oe.on("error",(Pe)=>{clearTimeout(ke),Y(Error(di(P,null,`${Pe.message}
${me()}`.trim())))}),oe.on("close",(Pe)=>{if(clearTimeout(ke),Pe!==0){Y(Error(di(P,Pe,me())));return}H(L?.stdoutOnly?se.stdout:me())})})}async function pi(P){for(let L of P)await fn(L)}async function Il(P){for(let L of P)try{await fn(L)}catch(H){console.warn(H instanceof Error?H.message:String(H))}}var kn=Object.fromEntries(er.map((P)=>[P.id,`npx -y cc-safety-net hook ${P.flags[1]}`]));var lr=kn.cursor,Ol=30;function Qr(P){return Zr(P.home,".cursor","hooks.json")}var ar="cc-safety-net";function gi(P){let L=Zr(P.home,".cursor","plugins");return{cache:Zr(L,"cache",ar),marketplaceClone:Zr(L,"marketplaces","github.com","kenryu42","cc-safety-net")}}async function $l(P){let L=Object.values(gi(P));if(!L.some((Y)=>mi(Y)))return;let H="No marketplace matches";return await fn(["cursor-agent","plugin","marketplace","remove",ar]).catch((Y)=>{if(!(Y instanceof Error&&Y.message.includes(H)))throw Y}),L.forEach((Y)=>ty(Y,{recursive:!0,force:!0})),[`Removed the ${ar} marketplace from your Cursor account.`,"If /plugins in cursor-agent still lists CC Safety Net as installed, uninstall it there."].join(`
`)}function it(P){return typeof P==="object"&&P!==null&&!Array.isArray(P)}function fi(){return{command:lr,timeout:Ol,failClosed:!0}}function Xr(P){return it(P)&&P.command===lr}function oy(P){return Object.keys(P).length===3&&P.command===lr&&P.timeout===Ol&&P.failClosed===!0}function iy(P){try{return JSON.parse(ny(P,"utf-8"))}catch(L){if(L instanceof SyntaxError)throw Error(`Failed to parse Cursor hooks config ${P}: ${L.message}`);throw L}}function Dl(P){let L=iy(P);if(!it(L))throw Error(`Cursor hooks config ${P} must be a JSON object`);if(L.version!==1)throw Error(`Cursor hooks config ${P} must set "version": 1`);if(L.hooks!==void 0&&!it(L.hooks))throw Error(`Cursor hooks config ${P} "hooks" must be an object`);let H=it(L.hooks)?L.hooks.preToolUse:void 0;if(H!==void 0&&!Array.isArray(H))throw Error(`Cursor hooks config ${P} "hooks.preToolUse" must be an array`);return L}function Nl(P){let L=it(P.hooks)?P.hooks.preToolUse:void 0;return Array.isArray(L)?L:[]}function sy(P){if(!P.some(Xr))return[...P,fi()];return P.reduce((L,H)=>{if(!Xr(H))return L.result.push(H),L;if(!L.inserted)L.result.push(fi()),L.inserted=!0;return L},{result:[],inserted:!1}).result}function Ll(P,L,H){let Y=it(L.hooks)?L.hooks:{},Z={...L,hooks:{...Y,preToolUse:H}};an(P,`${JSON.stringify(Z,null,2)}
`)}function jl(P){let L=Qr(P);if(!mi(L))return ey(ry(L),{recursive:!0}),an(L,`${JSON.stringify({version:1,hooks:{preToolUse:[fi()]}},null,2)}
`),{path:L,alreadyInstalled:!1};let H=Dl(L),Y=Nl(H),Z=Y.filter(Xr);if(it(H.hooks)&&Array.isArray(H.hooks.preToolUse)&&Z.length===1&&Z[0]!==void 0&&oy(Z[0]))return{path:L,alreadyInstalled:!0};return Ll(L,H,sy(Y)),{path:L,alreadyInstalled:!1}}function Fl(P){let L=Qr(P);if(!mi(L))return{path:L,alreadyInstalled:!1};let H=Dl(L),Y=Nl(H),Z=Y.filter((oe)=>!Xr(oe));if(Z.length===Y.length)return{path:L,alreadyInstalled:!1};return Ll(L,H,Z),{path:L,alreadyInstalled:!0}}function cy(P){if(!P||typeof P!=="object"||Array.isArray(P))return[];let L=P.hooks;if(!L||typeof L!=="object"||Array.isArray(L))return[];let H=L.preToolUse;if(!Array.isArray(H))return[];return H.filter((Y)=>!!Y&&typeof Y==="object"&&!Array.isArray(Y)&&Y.command===lr)}function dy(P){let L=[];if(P.length>1)L.push("Multiple managed cc-safety-net hooks found; reinstall to collapse duplicates");let H=P[0];if(H&&H.failClosed!==!0)L.push('Managed hook is missing "failClosed": true; reinstall to repair');if(H&&H.timeout!==30)L.push('Managed hook "timeout" is not 30; reinstall to repair');return L}var eo="Claude Code plugin",vi="Cursor plugin";function uy(P){let L=yi(gi(P).cache,ar);if(!hi(L))return{};try{return{version:ay(L).map((H)=>yi(L,H)).find((H)=>hi(yi(H,".cache-complete")))}}catch{return{unreadable:L}}}function py(P,L){if(L){let Z=["Cursor records enabled plugins on your Cursor account, which doctor cannot check, and keeps a plugin's files after it is uninstalled.","Cursor pins marketplace plugins to the commit they were added at, so `cc-safety-net update` cannot update this plugin, while the npx hook (`cc-safety-net install --cursor`) stays current."].join(" ");return{method:vi,configPath:L,duplicate:`The Cursor plugin also runs this check, so every tool call is checked twice. ${Z} If the plugin is installed, run \`cc-safety-net uninstall --cursor\`, uninstall CC Safety Net from /plugins in cursor-agent, then run \`cc-safety-net install --cursor\`.`,alone:`${Z} If /plugins in cursor-agent does not list CC Safety Net as installed, run \`cc-safety-net install --cursor\`.`}}let H=cl(P);if(!H)return;let Y="Cursor runs the Claude Code plugin only while it imports Claude Code plugins, which doctor cannot check.";return{method:eo,configPath:H,duplicate:`The Claude Code plugin also runs this check in Cursor, so every tool call is checked twice. ${Y} If Cursor runs it, run \`cc-safety-net uninstall --cursor\` to remove this hook.`,alone:`${Y} If it stops, run \`cc-safety-net install --cursor\`.`}}function Hl(P){let L=fy(P),H=uy(P.environment);if(H.unreadable)return L.status==="configured"?{...L,errors:[...L.errors??[],`Cannot read ${H.unreadable}, so doctor cannot tell whether the Cursor plugin also runs this check.`]}:{platform:"cursor",status:"not-inspected"};let Y=py(P.environment,H.version);if(!Y)return L;if(L.status==="configured")return{...L,errors:[...L.errors??[],Y.duplicate]};return{platform:"cursor",status:"configured",method:Y.method,configPath:Y.configPath,errors:[...L.errors??[],Y.alone]}}function fy(P){let L=Qr(P.environment);if(!hi(L))return{platform:"cursor",status:"n/a",configPath:L};let H;try{H=JSON.parse(ly(L,"utf-8"))}catch(oe){return{platform:"cursor",status:"n/a",configPath:L,errors:[`Failed to parse Cursor hooks config ${L}: ${oe instanceof Error?oe.message:String(oe)}`]}}let Y=cy(H);if(Y.length===0)return{platform:"cursor",status:"n/a",configPath:L};let Z=dy(Y);return{platform:"cursor",status:"configured",method:"hook config",configPath:L,errors:Z.length>0?Z:void 0}}import{readdirSync as my}from"node:fs";import{join as bi,resolve as gy}from"node:path";var wi="cc-safety-net";function ki(P){let L=P.env.get("DSH_HOME");return bi(L?.trim()?gy(Nn(L,P.home)):bi(P.home,".dsh"),"profiles")}function Ml(P){let L=ki(P),H=dn(L)?.isDirectory()?my(L,{withFileTypes:!0}).filter((Z)=>Z.isDirectory()&&Z.name!=="node_modules").map((Z)=>{let oe=bi(L,Z.name,"package.json");return{name:Z.name,configPath:oe,manifest:vn(oe)}}):[];return{installed:H.flatMap((Z)=>{if(Z.manifest.kind!=="ok")return[];let oe=Z.manifest.value;if(Xe(Xe(oe,"dependencies"),wi)===void 0)return[];let se=Xe(Xe(Xe(oe,"dsh"),"profile"),"bundles");return[{name:Z.name,configPath:Z.configPath,enabled:Array.isArray(se)&&se.includes(wi)}]}),unreadable:H.some((Z)=>Z.manifest.kind==="unreadable")}}function Ci(P){return Ml(P).installed}function Ul(P){let L=Ml(P.environment),H=L.installed.filter((oe)=>oe.enabled),Y=L.installed.filter((oe)=>!oe.enabled),Z=Y.map((oe)=>`${wi} is installed in the ${oe.name} profile but its bundle is disabled`);if(H.length>0)return{platform:"deepseek-harness",status:"configured",method:"dsh bundle",configPaths:H.map((oe)=>oe.configPath),...Z.length>0?{errors:Z}:{}};if(Y.length>0)return{platform:"deepseek-harness",status:"disabled",method:"dsh bundle",configPaths:Y.map((oe)=>oe.configPath),errors:Z};return L.unreadable?{platform:"deepseek-harness",status:"not-inspected"}:{platform:"deepseek-harness",status:"n/a"}}import{existsSync as ky}from"node:fs";import{existsSync as ql,mkdirSync as yy,readFileSync as hy}from"node:fs";import{dirname as vy,join as Si}from"node:path";function xi(P){return typeof P==="object"&&P!==null&&!Array.isArray(P)}function Pi(P,L){return xi(P)&&P.command===L}function Bl(P,L){return xi(P)&&Array.isArray(P.hooks)&&P.hooks.some((H)=>Pi(H,L))}function gt(P,L){return{hooks:[{type:"command",command:P,timeout:L}]}}function jn(P,L){return P.flatMap((H)=>{if(!xi(H)||!Array.isArray(H.hooks))return[H];let Y=H.hooks.filter((Z)=>!Pi(Z,L));if(Y.length===H.hooks.length)return[H];return Y.length===0?[]:[{...H,hooks:Y}]})}function Mt(P,L,H){let Y=P.filter((Z)=>Bl(Z,L));return Y.length===1&&JSON.stringify(Y[0])===JSON.stringify(gt(L,H))}function Ut(P,L){return P.find((H)=>Bl(H,L))}function Bt(P,L,H){let Y=Array.isArray(P.hooks)?P.hooks.find((Z)=>Pi(Z,L)):void 0;return[...P.matcher===void 0||P.matcher===""||P.matcher==="*"?[]:['Managed hook has a "matcher" that narrows coverage; reinstall to repair'],...Y?.type==="command"?[]:['Managed hook "type" is not "command"; reinstall to repair'],...Y?.timeout===H?[]:[`Managed hook "timeout" is not ${H}; reinstall to repair`]]}var yt=kn.devin,no=30,by={config:{},hooks:{},preToolUse:[]};function to(P,L=process.platform){let H=L==="win32"?P.env.get("APPDATA")||Si(P.home,"AppData","Roaming"):P.env.get("XDG_CONFIG_HOME")||Si(P.home,".config");return Si(H,"devin","config.json")}function Gl(P){return typeof P==="object"&&P!==null&&!Array.isArray(P)}function wy(P){try{return{ok:!0,value:JSON.parse(yn(hy(P,"utf-8")))}}catch(L){return{ok:!1,message:L instanceof Error?L.message:String(L)}}}function Ri(P){let L=wy(P);if(!L.ok)return`Failed to parse Devin CLI config ${P}: ${L.message}`;let H=L.value;if(!Gl(H))return`Devin CLI config ${P} must be a JSON object`;let Y=H.hooks===void 0?{}:H.hooks;if(!Gl(Y))return`Devin CLI config ${P} "hooks" must be an object`;let Z=Y.PreToolUse===void 0?[]:Y.PreToolUse;if(!Array.isArray(Z))return`Devin CLI config ${P} "hooks.PreToolUse" must be an array`;return{config:H,hooks:Y,preToolUse:Z}}function Vl(P){let L=Ri(P);if(typeof L==="string")throw Error(L);return L}function Kl(P,L,H){let Y={...L.config,hooks:{...L.hooks,PreToolUse:H}};an(P,`${JSON.stringify(Y,null,2)}
`)}function Jl(P){let L=to(P),H=ql(L)?Vl(L):by;if(Mt(H.preToolUse,yt,no))return{path:L,alreadyInstalled:!0};return yy(vy(L),{recursive:!0}),Kl(L,H,[...jn(H.preToolUse,yt),gt(yt,no)]),{path:L,alreadyInstalled:!1}}function zl(P){let L=to(P);if(!ql(L))return{path:L,alreadyInstalled:!1};let H=Vl(L),Y=jn(H.preToolUse,yt);if(JSON.stringify(Y)===JSON.stringify(H.preToolUse))return{path:L,alreadyInstalled:!1};return Kl(L,H,Y),{path:L,alreadyInstalled:!0}}function Wl(P){let L=to(P.environment);if(!ky(L))return{platform:"devin",status:"n/a",configPath:L};let H=Ri(L);if(typeof H==="string")return{platform:"devin",status:"n/a",configPath:L,errors:[H]};let Y=Ut(H.preToolUse,yt);if(!Y)return{platform:"devin",status:"n/a",configPath:L};let Z=Bt(Y,yt,no);return{platform:"devin",status:"configured",method:"hook config",configPath:L,errors:Z.length>0?Z:void 0}}import{existsSync as Ty,readFileSync as Ay}from"node:fs";import{existsSync as Gt,mkdirSync as Cy,readFileSync as xy,rmSync as Py}from"node:fs";import{dirname as Sy,join as Ti}from"node:path";var ht=kn.droid,ro=30;function oo(P){return Ti(P.home,".factory","hooks.json")}function Yl(P){return Ti(P.home,".factory","settings.json")}function Zl(P){return Ti(P.home,".factory","hooks","hooks.json")}function Ei(P){return typeof P==="object"&&P!==null&&!Array.isArray(P)}function Xl(P){try{return JSON.parse(yn(xy(P,"utf-8")))}catch(L){if(L instanceof SyntaxError)throw Error(`Failed to parse Factory Droid hooks config ${P}: ${L.message}`);throw L}}function Ai(P){let L=Xl(P);if(!Ei(L))throw Error(`Factory Droid hooks config ${P} must be a JSON object`);if(L.PreToolUse===void 0||Array.isArray(L.PreToolUse))return L;throw Error(`Factory Droid hooks config ${P} "PreToolUse" must be an array`)}function Ry(P){if(!Gt(P))return{};let L=Xl(P);return Ei(L)&&Ei(L.hooks)&&L.hooks.PreToolUse!==void 0?{PreToolUse:L.hooks.PreToolUse}:{}}function Ey(P){let L=Zl(P);return{...Ry(Yl(P)),...Gt(L)?Ai(L):{}}}function Ql(P){return Array.isArray(P.PreToolUse)?P.PreToolUse:[]}function ec(P,L,H){an(P,`${JSON.stringify({...L,PreToolUse:H},null,2)}
`)}function nc(P){let L=oo(P),H=Gt(L),Y=H?Ai(L):Ey(P),Z=Ql(Y);if(H&&Mt(Z,ht,ro))return{path:L,alreadyInstalled:!0};return Cy(Sy(L),{recursive:!0}),ec(L,Y,[...jn(Z,ht),gt(ht,ro)]),{path:L,alreadyInstalled:!1}}function tc(P){let L=oo(P);if(!Gt(L))return{path:L,alreadyInstalled:!1};let H=Ai(L),Y=Ql(H),Z=jn(Y,ht);if(JSON.stringify(Z)===JSON.stringify(Y))return{path:L,alreadyInstalled:!1};let oe=Gt(Yl(P))||Gt(Zl(P));if(Z.length===0&&Object.keys(H).length===1&&!oe)return Py(L),{path:L,alreadyInstalled:!0};return ec(L,H,Z),{path:L,alreadyInstalled:!0}}function rc(P){let L=oo(P.environment);if(!Ty(L))return{platform:"droid",status:"n/a",configPath:L};let H;try{H=JSON.parse(yn(Ay(L,"utf-8")))}catch(se){return{platform:"droid",status:"n/a",configPath:L,errors:[`Failed to parse Factory Droid hooks config ${L}: ${se instanceof Error?se.message:String(se)}`]}}let Y=typeof H==="object"&&H!==null&&"PreToolUse"in H?H.PreToolUse:void 0,Z=Ut(Array.isArray(Y)?Y:[],ht);if(!Z)return{platform:"droid",status:"n/a",configPath:L};let oe=[...Z.commandRegex===void 0||Z.commandRegex===""?[]:['Managed hook has a "commandRegex" that narrows coverage; reinstall to repair'],...Bt(Z,ht,ro)];return{platform:"droid",status:"configured",method:"hook config",configPath:L,errors:oe.length>0?oe:void 0}}import{existsSync as _y}from"node:fs";import{join as _i}from"node:path";var Ii="gemini-safety-net";function Oi(P){let L=_i(P.home,".gemini","extensions"),H=_i(L,Ii);if(!_y(H))return{platform:"gemini-cli",status:"n/a"};let Y=_i(L,"extension-enablement.json"),Z=vn(Y);if(Z.kind==="unreadable")return{platform:"gemini-cli",status:"not-inspected"};let oe=Z.kind==="ok"?Xe(Xe(Z.value,Ii),"overrides"):void 0;if(Array.isArray(oe)&&oe.some((me)=>typeof me==="string"&&me.startsWith("!")))return{platform:"gemini-cli",status:"disabled",method:"extension config",configPath:Y,errors:[`${Ii} is disabled in Gemini CLI`]};return{platform:"gemini-cli",status:"configured",method:"extension config",configPath:H}}function oc(P){return Oi(P.environment)}import{existsSync as Dy,readFileSync as fc,statSync as Ny}from"node:fs";import{dirname as pc,join as Ly}from"node:path";import{existsSync as sc,mkdirSync as Iy,readFileSync as ac,rmSync as Oy}from"node:fs";import{dirname as $y,join as ic}from"node:path";var Gn=kn["grok-build"],so=30,$i=gt(Gn,so);function ao(P){return ic(P.env.get("GROK_HOME")??ic(P.home,".grok"),"hooks","cc-safety-net.json")}function lo(P){return typeof P==="object"&&P!==null&&!Array.isArray(P)}function lc(P){try{let L=JSON.parse(P);return lo(L)?L:null}catch{return null}}function cc(P){let L=lo(P.hooks)?P.hooks.PreToolUse:void 0;return Array.isArray(L)?L:[]}function io(P,L,H){let Y=lo(L.hooks)?L.hooks:{};an(P,`${JSON.stringify({...L,hooks:{...Y,PreToolUse:H}},null,2)}
`)}function dc(P){let L=ao(P);if(!sc(L))return Iy($y(L),{recursive:!0}),io(L,{},[$i]),{path:L,alreadyInstalled:!1};let H=lc(ac(L,"utf-8"));if(!H)return io(L,{},[$i]),{path:L,alreadyInstalled:!1};let Y=cc(H);if(Mt(Y,Gn,so))return{path:L,alreadyInstalled:!0};return io(L,H,[...jn(Y,Gn),$i]),{path:L,alreadyInstalled:!1}}function uc(P){let L=ao(P);if(!sc(L))return{path:L,alreadyInstalled:!1};let H=lc(ac(L,"utf-8"));if(!H)return{path:L,alreadyInstalled:!1};let Y=cc(H),Z=jn(Y,Gn);if(JSON.stringify(Z)===JSON.stringify(Y))return{path:L,alreadyInstalled:!1};let oe=lo(H.hooks)?H.hooks:{};if(Z.length===0&&Object.keys(H).length===1&&Object.keys(oe).length===1)return Oy(L),{path:L,alreadyInstalled:!0};return io(L,H,Z),{path:L,alreadyInstalled:!0}}function Di(P){return!!P&&typeof P==="object"&&!Array.isArray(P)}function jy(P){try{return Ny(P,{throwIfNoEntry:!1})?.isFile()===!0?fc(P,"utf-8"):""}catch{return}}function mc(P){let L=ao(P.environment);if(!Dy(L))return{platform:"grok-build",status:"n/a",configPath:L};let H;try{H=JSON.parse(fc(L,"utf-8"))}catch(Te){return{platform:"grok-build",status:"n/a",configPath:L,errors:[`Failed to parse Grok Build hooks config ${L}: ${Te instanceof Error?Te.message:String(Te)}`]}}let Y=Di(H)&&Di(H.hooks)&&Array.isArray(H.hooks.PreToolUse)?H.hooks.PreToolUse:[],Z=Ut(Y,Gn);if(!Z)return{platform:"grok-build",status:"n/a",configPath:L};let oe=Array.isArray(Z.hooks)?Z.hooks.findIndex((Te)=>Di(Te)&&Te.command===Gn):-1,se=`global/cc-safety-net:pre_tool_use[${Y.indexOf(Z)}].hooks[${oe}]`,me=Ly(pc(pc(L)),"disabled-hooks"),he=jy(me),ke=he?.split(`
`).some((Te)=>Te.trim()===se)===!0,Pe=[...he===void 0?[`Cannot read ${me}, so doctor cannot tell whether Grok Build skips the hook`]:[],...ke?[`Grok Build skips the hook: ${se} is listed in ${me}; enable it in /hooks`]:[],...Bt(Z,Gn,so)];return{platform:"grok-build",status:ke?"disabled":"configured",method:"hook config",configPath:L,errors:Pe.length>0?Pe:void 0}}import{readFileSync as xc}from"node:fs";import{join as Pc}from"node:path";var Sn="cc-safety-net",Ni="# cc-safety-net managed Hermes Agent plugin. Do not edit. Reinstall with: npx -y cc-safety-net install --hermes-agent",Fy=30;function gc(P){return`${Ni}
# version: ${P}
`}function Hy(P){return`${gc(P)}name: ${Sn}
version: "${P}"
description: "Block destructive commands and secret-file access before Hermes runs a tool."
author: "cc-safety-net"
provides_hooks:
  - pre_tool_call
`}function My(P){return`${gc(P)}"""CC Safety Net guard for Hermes Agent.

Registers pre_tool_call and forwards the tool call to the packaged CC Safety Net
adapter (cc-safety-net hook --hermes-agent) over JSON stdin. The adapter prints nothing
when the call is allowed and an {"action": "block", ...} directive when it is denied.
Every transport and analysis failure is returned as a block that names its cause.
"""

import json
import os
import shutil
import signal
import subprocess

HOOK_EVENT = "pre_tool_call"
SUPPORTED_TOOLS = ("patch", "read_file", "terminal", "write_file")
ANALYZER = [${kn["hermes-agent"].split(" ").map((L)=>`"${L}"`).join(", ")}]
TIMEOUT_SECONDS = ${Fy}


def _block(detail):
    return {"action": "block", "message": "CC Safety Net failed closed: " + detail}


def _terminal_cwd(task_id):
    """Return the directory Hermes will run this terminal command in.

    A \`terminal\` call without \`workdir\` runs in the session's own cwd RECORD, not in the
    Hermes process directory: \`_resolve_command_cwd\` in tools/terminal_tool.py returns
    \`workdir or get_session_cwd(session_key) or default_cwd\`, and that record is rewritten
    after every completed command, so it IS the session's \`cd\` state. The session key is
    derived exactly as terminal_tool derives it: the contextvar when set, the raw task_id
    otherwise. No record yet (first command of a session) means \`default_cwd\`, which the local
    terminal backend reads from \`TERMINAL_CWD\` (\`hermes_cli/config.py\` bridges the configured
    \`terminal.cwd\` into it) and only then falls back to the process directory.
    """
    from tools.approval import get_current_session_key
    from tools.terminal_tool import get_session_cwd

    return (
        get_session_cwd(get_current_session_key(default="") or (task_id or ""))
        or os.environ.get("TERMINAL_CWD")
        or os.getcwd()
    )


def _file_tool_cwd(task_id):
    """Return the directory Hermes resolves this file tool's relative paths against.

    tools/file_tools.py passes \`task_id or "default"\` to \`_resolve_base_dir\`, which walks the
    session's cwd record, the task's cwd override, \`TERMINAL_CWD\`, then the process directory.
    tools.file_tools defines it up to v2026.8.31 and re-exports it from tools.file_tools_paths since.
    """
    from tools.file_tools import _resolve_base_dir

    return str(_resolve_base_dir(task_id or "default"))


def _pre_tool_call(tool_name="", args=None, session_id="", task_id="", **_):
    if tool_name not in SUPPORTED_TOOLS:
        return None

    executable = shutil.which(ANALYZER[0])
    if executable is None:
        return _block(ANALYZER[0] + " was not found on PATH.")

    try:
        cwd = _terminal_cwd(task_id) if tool_name == "terminal" else _file_tool_cwd(task_id)
    except OSError as error:
        return _block("the working directory could not be resolved (%s)." % error)
    except ImportError as error:
        # Without Hermes' own directory lookup we cannot tell which directory the call acts in,
        # and analysing the wrong one clears every path-scoped protection.
        return _block(
            "the Hermes %s directory could not be read (%s). Update cc-safety-net and "
            "reinstall the plugin with: npx -y cc-safety-net install --hermes-agent."
            % ("session" if tool_name == "terminal" else "file tool", error)
        )

    payload = json.dumps(
        {
            "hook_event_name": HOOK_EVENT,
            "tool_name": tool_name,
            "tool_input": args if isinstance(args, dict) else None,
            "session_id": session_id if isinstance(session_id, str) else "",
            "cwd": cwd,
        }
    )

    try:
        if os.name == "nt":
            launch_options = {}
        else:
            launch_options = {"start_new_session": True}
        process = subprocess.Popen(
            [executable] + ANALYZER[1:],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            # Decode explicitly: the analyzer writes UTF-8, and a locale decoder would raise
            # UnicodeDecodeError on output it cannot read. "replace" turns that into unreadable
            # output, which blocks with its cause named.
            encoding="utf-8",
            errors="replace",
            # Resolve the analyzer from a neutral directory: npx prefers a repository-local
            # node_modules/.bin/cc-safety-net, so inheriting Hermes' working directory would
            # let workspace contents stand in for the analyzer. The payload's "cwd" above is
            # still the real Hermes working directory, which the analysis needs.
            cwd=os.path.expanduser("~"),
            # Own process group so the timeout below can kill the whole tree: npx's descendants
            # outlive a kill aimed at npx alone and keep holding the pipes captured here. Windows
            # uses taskkill's process-tree traversal instead because sessions are POSIX-only.
            **launch_options,
        )
    except OSError as error:
        return _block("analysis could not start (%s)." % error)

    try:
        stdout, _ = process.communicate(payload, timeout=TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired:
        try:
            if os.name == "nt":
                system_root = os.environ.get("SystemRoot")
                if not system_root:
                    raise OSError("SystemRoot is unavailable")
                subprocess.run(
                    [
                        os.path.join(system_root, "System32", "taskkill.exe"),
                        "/PID",
                        str(process.pid),
                        "/T",
                        "/F",
                    ],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=1,
                    check=False,
                )
            else:
                os.killpg(process.pid, signal.SIGKILL)
        except (OSError, subprocess.SubprocessError):
            pass
        try:
            process.communicate(timeout=1)
        except (OSError, subprocess.SubprocessError):
            pass
        return _block("analysis timed out after %ss." % TIMEOUT_SECONDS)

    if process.returncode != 0:
        return _block("analysis exited with status %s." % process.returncode)

    directive = (stdout or "").strip()
    if not directive:
        return None

    try:
        parsed = json.loads(directive)
    except ValueError:
        return _block("analysis returned unreadable output.")

    if isinstance(parsed, dict) and parsed.get("action") == "block":
        message = parsed.get("message")
        if isinstance(message, str) and message:
            return parsed
    return _block("analysis returned an unexpected directive.")


def register(ctx):
    ctx.register_hook("pre_tool_call", _pre_tool_call)
`}function cr(P){return[{name:"__init__.py",content:My(P)},{name:"plugin.yaml",content:Hy(P)}]}import{mkdirSync as Uy,readdirSync as By,readFileSync as yc,rmSync as Li}from"node:fs";import{basename as Gy,dirname as qy,join as Fn}from"node:path";var Vy="__pycache__",Ky=/^[a-z0-9][a-z0-9_-]{0,63}$/;function Jy(P){try{return yc(P,"utf-8").trim()}catch{return}}function ji(P){let L=P.env.get("HERMES_HOME")?.trim();if(L&&Gy(qy(L))==="profiles")return L;let H=L||Fn(P.home,".hermes"),Y=Fn(H,"active_profile"),Z=Jy(Y),oe=Z?.toLowerCase();if(!oe||oe==="default")return H;if(!Ky.test(oe))throw Error(`Invalid Hermes profile name "${Z}" in ${Y}; run \`hermes profile use <name>\` with a valid profile.`);return Fn(H,"profiles",oe)}function Fi(P){return Fn(ji(P),"plugins",Sn)}function Hi(P){return P.startsWith(Ni)}function Mi(P,L){let H=Fi(P),Y=dn(H);if(Y&&(Y.isSymbolicLink()||!Y.isDirectory()))throw Error(`Refusing to ${L} ${H}: not a regular directory. Move or remove it and rerun ${L==="install"?"install":"uninstall"} --hermes-agent.`);return H}function hc(P,L){let H=dn(P);if(!H)return;if(H.isSymbolicLink()||!H.isFile())throw Error(`Refusing to ${L} ${P}: not a regular file. Move or remove it.`);let Y=yc(P,"utf-8");if(!Hi(Y))throw Error(`Refusing to ${L} unmanaged file at ${P}. Move or remove it.`);return Y}function vc(P){let L=Mi(P,"install"),H=cr(pn());if(H.map((Z)=>hc(Fn(L,Z.name),"overwrite")).every((Z,oe)=>Z===H[oe]?.content))return{path:L,alreadyInstalled:!0};return Uy(L,{recursive:!0}),H.forEach((Z)=>{an(Fn(L,Z.name),Z.content)}),{path:L,alreadyInstalled:!1}}function Ui(P){let L=Mi(P,"remove");if(!dn(L))return[];return cr(pn()).filter((H)=>hc(Fn(L,H.name),"remove")!==void 0)}function bc(P){let L=Mi(P,"remove");if(!dn(L))return{path:L,alreadyInstalled:!1};let H=Ui(P);if(H.forEach((Y)=>{Li(Fn(L,Y.name))}),Li(Fn(L,Vy),{recursive:!0,force:!0}),By(L).length===0)Li(L,{recursive:!0});return{path:L,alreadyInstalled:H.length>0}}var dr="hermes-agent",wc=/^([^\s#][^:]*):/,zy=/^\s+([A-Za-z_][\w-]*):/,kc=/^\s+-\s*(.*)$/;function Wy(P){return P.trim().replace(/^(["'])(.*)\1$/,"$2")}function Yy(P){let L=P.split(/\r?\n/),H=L.findIndex((oe)=>wc.exec(oe)?.[1]?.trim()==="plugins");if(H===-1)return[];let Y=L.slice(H+1),Z=Y.findIndex((oe)=>wc.test(oe));return Z===-1?Y:Y.slice(0,Z)}function Cc(P,L){let H=Yy(P),Y=H.findIndex((se)=>zy.exec(se)?.[1]===L);if(Y===-1)return[];let Z=H.slice(Y+1),oe=Z.findIndex((se)=>!kc.test(se));return(oe===-1?Z:Z.slice(0,oe)).map((se)=>Wy(kc.exec(se)?.[1]??""))}function Zy(P){try{return xc(Pc(ji(P),"config.yaml"),"utf-8")}catch{return}}function Bi(P){let L=Zy(P)??"";return Cc(L,"enabled").includes(Sn)&&!Cc(L,"disabled").includes(Sn)}function Sc(P){return/^# version:\s*(.+)$/m.exec(P)?.[1]?.trim()}function Xy(P,L){let H=dn(P);if(!H)return{error:`${L.name} is missing from ${P}; run install --hermes-agent`};if(H.isSymbolicLink()||!H.isFile())return{error:`${P} is a symlink or not a regular file; move or remove it`};try{let Y=xc(P,"utf-8");if(!Hi(Y))return{error:`Unmanaged ${L.name} occupies ${P}; move or remove it`};if(Sc(Y)===pn()&&Y!==L.content)return{error:`Modified ${L.name} occupies ${P}; run install --hermes-agent to restore it`};return{content:Y}}catch(Y){return{error:`Failed to read ${P}: ${Y instanceof Error?Y.message:String(Y)}`}}}function Qy(P){try{return{path:Fi(P)}}catch(L){return{error:L instanceof Error?L.message:String(L)}}}function Rc(P){let L=Qy(P.environment);if("error"in L)return{platform:dr,status:"n/a",errors:[L.error]};let H=L.path,Y=Gr(dr,H);if(Y)return Y;let Z=cr(pn()).map((he)=>Xy(Pc(H,he.name),he)),oe=Z.flatMap((he)=>("error"in he)?[he.error]:[]);if(oe.length>0)return{platform:dr,status:"n/a",configPath:H,errors:oe};let se=Z.some((he)=>("content"in he)&&Sc(he.content)!==pn()),me=se?["Installed Hermes Agent plugin is outdated; run install --hermes-agent to update"]:[];if(!Bi(P.environment))return{platform:dr,status:"disabled",method:"plugin directory",configPath:H,errors:[`${Sn} is not enabled in Hermes; run \`hermes plugins enable ${Sn}\``,...me]};return{platform:dr,status:"configured",method:"plugin directory",configPath:H,errors:se?me:void 0}}import{existsSync as eh,readFileSync as nh}from"node:fs";import{join as Vi}from"node:path";var th=/cc-safety-net\s+hook\s+(?:[^\s]+\s+)*--kimi-code(\s|["']|$)/,Gi="cc-safety-net",uo="plugin config",rh=new Set(["event","matcher","command","timeout"]),oh=new Set(["PreToolUse","PostToolUse","PostToolUseFailure","PermissionRequest","PermissionResult","UserPromptSubmit","UserPromptQueued","TurnStarted","Stop","StopFailure","Interrupt","SessionStart","SessionEnd","SessionHeartbeat","SubagentStart","SubagentStop","TaskStarted","PreCompact","PostCompact","Notification"]);function Ec(P){return P.env.get("KIMI_CODE_HOME")||Vi(P.home,".kimi-code")}function co(P,L){let H=[""],Y="",Z=0;for(let oe=0;oe<P.length;oe++){let se=P[oe];if(Y!==""){let me=Y==='"'&&se==="\\"?P[++oe]??"":"";if(H[H.length-1]+=se+me,me===""&&se===Y)Y="";continue}if(se==="#"){let me=P.indexOf(`
`,oe);oe=(me===-1?P.length:me)-1;continue}if(se===L&&Z===0){H.push("");continue}if(se==='"'||se==="'")Y=se;if(se==="["||se==="{")Z++;if(se==="]"||se==="}")Z--;H[H.length-1]+=se}return H.map((oe)=>oe.trim()).filter((oe)=>oe!=="")}function Tc(P){let L=/^(?:"([^"]*)"|'([^']*)'|([^\s="']+))\s*=\s*([\s\S]+)$/.exec(P);return L?{key:L[1]??L[2]??L[3]??"",value:L[4]??""}:void 0}function qi(P){return P===void 0?void 0:/^("""|'''|"|')([\s\S]*)\1$/.exec(P)?.[2]}function ih(P){let L=P.split(/(?=^\s*\[)/m),H=L.filter((Y)=>!/^\s*\[/.test(Y)).flatMap((Y)=>co(Y,`
`)).map(Tc).find((Y)=>Y?.key==="hooks")?.value;if(H!==void 0)return co(H.slice(1,-1),",").map((Y)=>co(Y.slice(1,-1),","));return L.filter((Y)=>/^\s*\[\[hooks]]/.test(Y)).map((Y)=>co(Y.replace(/^\s*\[\[hooks]]/,""),`
`))}function sh(P){let L=P.map(Tc),H=P.find((Pe,Te)=>L[Te]===void 0),Y=L.find((Pe)=>Pe!==void 0&&!rh.has(Pe.key))?.key,Z=L.find((Pe,Te)=>Pe!==void 0&&L.findIndex((_e)=>_e?.key===Pe.key)<Te)?.key,oe=(Pe)=>L.find((Te)=>Te?.key===Pe)?.value,se=oe("matcher"),me=oe("timeout"),he=Number(me?.replace(/(?<=[\da-f])_(?=[\da-f])/gi,""));return[[H!==void 0,`"${H}" is not a key = value pair`],[Y!==void 0,`unknown key "${Y}"`],[Z!==void 0,`duplicate key "${Z}"`],[!oh.has(qi(oe("event"))??""),'"event" is not a Kimi Code hook event'],[se!==void 0&&qi(se)===void 0,'"matcher" is not a string'],[!qi(oe("command")),'"command" is missing or empty'],[me!==void 0&&!(Number.isInteger(he)&&he>=1&&he<=600),'"timeout" is not an integer from 1 to 600']].find(([Pe])=>Pe)?.[1]}function ah(P){let L=Vi(Ec(P),"plugins","installed.json"),H=vn(L);if(H.kind==="missing")return;let Y=H.kind==="ok"?Xe(H.value,"plugins"):void 0;if(!Array.isArray(Y))return{platform:"kimi-code",status:"n/a",configPath:L,errors:[`Cannot read ${L}, so doctor cannot tell whether the Kimi Code plugin is installed`]};let Z=Y.find((oe)=>Xe(oe,"id")===Gi);if(Z===void 0)return;if(Xe(Z,"enabled")!==!0)return{platform:"kimi-code",status:"disabled",method:uo,configPath:L,errors:[`${Gi} is installed but not enabled in Kimi Code; run /plugins enable ${Gi}`]};return{platform:"kimi-code",status:"configured",method:uo,configPath:L}}function po(P){let L=Vi(Ec(P.environment),"config.toml"),H=()=>ah(P.environment)??{platform:"kimi-code",status:"n/a",configPath:L};if(!eh(L))return H();let Y;try{Y=nh(L,"utf-8")}catch(se){return{platform:"kimi-code",status:"n/a",configPath:L,errors:[`Failed to read ${L}: ${se instanceof Error?se.message:String(se)}`]}}if(!th.test(Y))return H();let oe=(/"""|'''/.test(Y)?[]:ih(Y)).flatMap((se,me)=>{let he=sh(se);return he===void 0?[]:[`Kimi Code ignores every hook because hooks entry ${me+1} is invalid (${he}); fix it in ${L}`]});return{platform:"kimi-code",status:oe.length>0?"disabled":"configured",method:"hook config",configPath:L,errors:oe.length>0?oe:void 0}}import{readFileSync as jc}from"node:fs";import{join as pr}from"node:path";var un="cc-safety-net",xn="index.js",qt="openclaw.plugin.json",Vt="package.json";var fo="// cc-safety-net managed OpenClaw plugin. Do not edit. Reinstall with: npx -y cc-safety-net install --openclaw";import{existsSync as lh,lstatSync as ch,readdirSync as dh,readFileSync as uh}from"node:fs";import{dirname as Ac,join as qn}from"node:path";import{fileURLToPath as ph}from"node:url";var Ki=qn("openclaw",un),bt=`run \`openclaw plugins enable ${un}\``,fh="config reload superseded by a newer runtime config source",mh=[xn,qt,Vt];function _c(P){let L=P.env.get("OPENCLAW_HOME")?.trim();return L?Nn(L,P.home):P.home}function Ic(P){let L=_c(P),H=P.env.get("OPENCLAW_STATE_DIR")?.trim();if(H)return Nn(H,L);let Y=P.env.get("OPENCLAW_CONFIG_PATH")?.trim();return Y?Ac(Nn(Y,L)):qn(L,".openclaw")}function Oc(P){let L=P.env.get("OPENCLAW_CONFIG_PATH")?.trim();return L?Nn(L,_c(P)):qn(Ic(P),"openclaw.json")}function ur(P){return qn(Ic(P),"extensions",un)}function gh(P){let L=dh(P);if(L.length===0)return!0;if(L.some((Z)=>!mh.includes(Z)))return!1;let H=qn(P,xn),Y=dn(H);return Y!==void 0&&!Y.isSymbolicLink()&&Y.isFile()&&uh(H,"utf-8").startsWith(fo)}function Ji(P){let L=ur(P),H=dn(L);if(!H)return;if(!H.isSymbolicLink()&&H.isDirectory()&&gh(L))return;throw Error(`Refusing to modify ${L}: it does not hold a cc-safety-net managed OpenClaw plugin. Move or remove it, then run the command again.`)}function $c(){let P=Ac(ph(import.meta.url));return[qn(P,Ki),qn(P,"..",Ki),qn(P,"..","..","..","dist",Ki)]}function zi(P=$c()){return P.find((L)=>lh(L)&&ch(L).isDirectory())}function yh(P=$c()){let L=zi(P);if(!L)throw Error("Packaged OpenClaw plugin directory not found. Reinstall cc-safety-net and try again.");return L}function Dc(P=yh()){return[["openclaw","plugins","install",P,"--force","--accept-capabilities"]]}function hh(P){let L=(()=>{try{return JSON.parse(P)}catch{return}})(),H=Xe(Xe(L,"plugin"),"status");return typeof H==="string"?H:void 0}async function vh(){await fn(["openclaw","plugins","enable",un]).catch((P)=>{if(!(P instanceof Error&&P.message.includes(fh)))throw P})}async function Nc(P){let L=async()=>hh(await fn(["openclaw","plugins","inspect",un,"--runtime","--json"],{stdoutOnly:!0})),H=await L(),Y=H==="disabled"&&P;if(Y)await vh();let Z=Y?await L():H;if(Z==="loaded")return;throw Error(`${Z===void 0?`The ${un} plugin's load state could not be verified: OpenClaw's runtime inspect report was unreadable.`:Z==="disabled"?`OpenClaw reports the ${un} plugin with status "disabled"; ${bt}.`:`OpenClaw reports the ${un} plugin with status "${Z}".`} Run \`openclaw plugins inspect ${un} --runtime\` for details.`)}var mo="openclaw";function Kt(P,L){let H=pr(P,L),Y=dn(H);if(!Y)return{error:`${L} is missing from ${H}; run install --openclaw`};if(Y.isSymbolicLink()||!Y.isFile())return{error:`${H} is a symlink or not a regular file; move or remove it`};try{return{content:jc(H,"utf-8")}}catch(Z){return{error:`Failed to read ${H}: ${Z instanceof Error?Z.message:String(Z)}`}}}function Fc(P){try{return JSON.parse(yn(P))}catch{return}}function bh(P){let L=Kt(P,qt);if("error"in L)return L.error;if(Xe(Fc(L.content),"id")===un)return;return`${pr(P,qt)} is not a valid ${un} manifest; run install --openclaw`}function wh(P){let L=Kt(P,Vt);if("error"in L)return L.error;let H=Xe(Xe(Fc(L.content),"openclaw"),"extensions");if(Array.isArray(H)&&H.includes(`./${xn}`))return;return`${pr(P,Vt)} does not point OpenClaw at ${xn}; run install --openclaw`}function Lc(P){return Array.isArray(P)?P.filter((L)=>typeof L==="string"):[]}function kh(P){let L=Oc(P);if(!dn(L))return`${un} is not enabled; ${bt}`;let H=(()=>{try{return JSON.parse(yn(jc(L,"utf-8")))}catch{return}})();if(H===void 0)return`Failed to read ${L}; fix it, then ${bt}`;let Y=Xe(H,"plugins");if(Xe(Y,"enabled")===!1)return`plugins.enabled is false in ${L}; no OpenClaw plugin loads`;let Z=Xe(Xe(Xe(Y,"entries"),un),"enabled");if(Lc(Xe(Y,"deny")).includes(un)||Z===!1)return`${un} is disabled in ${L}; ${bt}`;let oe=Lc(Xe(Y,"allow"));if(oe.length>0&&!oe.includes(un))return`plugins.allow in ${L} does not list ${un}; add it, then ${bt}`;if(oe.includes(un)||Z===!0)return;return`${un} is not enabled; ${bt}`}function Hc(P){return/^\/\/ version:\s*(.+)$/m.exec(P)?.[1]?.trim()}function Ch(P,L,H){if(H===void 0)return[];let Y=Kt(H,xn);if(!(("content"in Y)&&Hc(Y.content)===L))return[];return[xn,qt,Vt].flatMap((oe)=>{let se=Kt(P,oe),me=Kt(H,oe);if("error"in se||"error"in me||se.content===me.content)return[];return[`Modified ${oe} occupies ${pr(P,oe)}; run install --openclaw to restore it`]})}function Mc(P){let L=ur(P.environment),H=Gr(mo,L);if(H)return H;let Y=Kt(L,xn),oe=["error"in Y?Y.error:Y.content.startsWith(fo)?void 0:`Unmanaged ${xn} occupies ${pr(L,xn)}; move or remove it`,bh(L),wh(L)].filter((Pe)=>Pe!==void 0),se="content"in Y?Hc(Y.content):void 0,me=oe.length>0?oe:Ch(L,se,zi());if(me.length>0)return{platform:mo,status:"n/a",configPath:L,errors:me};let he=se===pn()?[]:["Installed OpenClaw plugin is outdated; run install --openclaw to update"],ke=kh(P.environment);if(ke)return{platform:mo,status:"disabled",method:"plugin directory",configPath:L,errors:[ke,...he]};return{platform:mo,status:"configured",method:"plugin directory",configPath:L,errors:he.length>0?he:void 0}}import{existsSync as Ih,readFileSync as Oh}from"node:fs";import{basename as $h}from"node:path";import{existsSync as go,readFileSync as Yi,rmSync as xh}from"node:fs";import{join as _n}from"node:path";import{pathToFileURL as Ph}from"node:url";var fr="cc-safety-net",Pt=`${fr}@latest`,Zi=["opencode.json","opencode.jsonc"],Sh=60,Rh=250,Uc="CCSafetyNetPlugin",Eh={stringError:"Unterminated string in OpenCode config",bracketError:"Unmatched plugin array in OpenCode config"};function Bc(P){return _n(P.env.get("XDG_CONFIG_HOME")||_n(P.home,".config"),"opencode")}function Xi(P){return P.env.get("OPENCODE_CONFIG_DIR")||Bc(P)}function Qi(P){return Zi.map((L)=>_n(Xi(P),L))}function es(P){return[...new Set([Xi(P),Bc(P)])].flatMap((L)=>Zi.map((H)=>_n(L,H)))}function Gc(P){return _n(P.env.get("XDG_CACHE_HOME")||_n(P.home,".cache"),"opencode","packages",Pt)}function qc(P){xh(Gc(P),{recursive:!0,force:!0})}async function Vc(P){let L=(await fn(["opencode","--version"],{stdoutOnly:!0})).trim(),H=/^(?:opencode\s+)?v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(L),Y=Number(H?.[1]),Z=Number(H?.[2]),oe=Number(H?.[3]);if(!H||Y!==1&&Y!==2||Y===1&&(Z<18||Z===18&&oe<29)||Y===2&&Z===0&&oe<6)throw Error(`OpenCode 1.18.29+ or 2.0.6+ is required; found ${L||"an unknown version"}.`);if(Y===2){for(let se of Qi(P)){if(!go(se))continue;let me=ts(Yi(se,"utf-8"),se);if(["plugin","plugins"].some((ke)=>{let Pe=Xe(me,ke);return Array.isArray(Pe)&&Pe.some((Te)=>yo(Te)&&(typeof Te==="string"?Te:Xe(Te,"package"))!==Pt)}))throw Error(`Change the cc-safety-net package spec in ${se} to ${Pt}, preserving its options, then retry. Adding another spec would create a duplicate plugin ID.`)}return{commands:[],afterInstall:async()=>{if((await fn(["opencode","plugin","add",Pt],{stdoutOnly:!0})).includes("is already configured in"))await Wi(),await fn(["opencode","plugin","update",Pt]);let me=await Wi();if(!/^cc-safety-net\s+\S+\s+cc-safety-net@latest\s*$/m.test(me))throw Error("OpenCode did not load cc-safety-net from cc-safety-net@latest. Run `opencode plugin list` for details.");let he=["--param",`location[directory]=${process.cwd()}`];await fn(["opencode","api","integration.list",...he]);let ke=await fn(["opencode","api","plugin.list",...he],{stdoutOnly:!0}),Pe=ns(ke);if(Pe)throw Error(Pe);if(!Kc(ke).some(Jc))throw Error("OpenCode lists no active cc-safety-net for this directory. Run `opencode api plugin.list` for details.")}}}return qc(P),{commands:[["opencode","plugin","-g","-f",Pt]],afterInstall:()=>Ah(P)}}function Kc(P){return Th(P).filter((L)=>Xe(L,"id")===fr||yo(Xe(Xe(L,"source"),"target"))).map((L)=>Xe(L,"state"))}function Jc(P){return Xe(P,"status")==="active"}function ns(P){let L=Kc(P);if(L.some(Jc))return;let H=L.find((Y)=>Xe(Y,"status")==="failed");if(!H)return;return`OpenCode reports cc-safety-net failed: ${String(Xe(H,"error")).split(`
`)[0]}`}function Th(P){if(!P)return[];try{let L=Xe(JSON.parse(P),"data");return Array.isArray(L)?L:[]}catch{return[]}}async function Wi(P=1){let L=await fn(["opencode","plugin","list"],{stdoutOnly:!0});if(/^cc-safety-net\s|\scc-safety-net@latest\s*$/m.test(L)||P===Sh)return L;return await new Promise((H)=>setTimeout(H,Rh)),Wi(P+1)}async function Ah(P){let L=_n(Gc(P),"node_modules",fr),H=_n(L,"package.json");if(!go(H))throw Error(`The OpenCode plugin cache at ${L} is missing its package, so OpenCode would load nothing and fail open. Run \`opencode plugin -g -f ${Pt}\` for details.`);let Y=Xe(JSON.parse(Yi(H,"utf-8")),"main");if(typeof Y!=="string")throw Error(`The cached OpenCode plugin at ${L} declares no "main" entry.`);let Z=_n(L,Y);if(typeof(await import(Ph(Z).href))[Uc]==="function")return;throw Error(`The cached OpenCode plugin at ${Z} does not export a callable ${Uc}, so OpenCode would load nothing and fail open.`)}function ts(P,L){try{return JSON.parse(yn(P))}catch(H){if(H instanceof SyntaxError)throw Error(`Failed to parse OpenCode config ${L}: ${H.message}`);throw H}}function yo(P){let L=typeof P==="string"?P:Xe(P,"package");return typeof L==="string"&&(L===fr||L.startsWith(`${fr}@`))}function rs(P){return["plugin","plugins"].some((L)=>{let H=Xe(P,L);return Array.isArray(H)&&H.some(yo)})}function _h(P,L){let Y=["plugin","plugins"].flatMap((Z)=>{let oe=hl(P,Z,Eh);if(!oe)return[];let se=[],me=0,he=oe.start+1,ke=P.slice(oe.start+1,oe.end).matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|[^"\s{}[\],/]+|[{}[\],]/g);for(let Pe of ke){if(Pe[0].startsWith("//")||Pe[0].startsWith("/*"))continue;let Te=oe.start+1+Pe.index;if(me===0)he=Te;if(Pe[0]==="{"||Pe[0]==="[")me++;if(Pe[0]==="}"||Pe[0]==="]")me--;if(me!==0||Pe[0]===",")continue;let _e=Te+Pe[0].length;if(yo(JSON.parse(yn(P.slice(he,_e)))))se.push({start:he,end:_e})}return se}).sort((Z,oe)=>Z.start-oe.start).reverse().reduce((Z,oe)=>{let se=/^(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*,/.exec(Z.slice(oe.end));if(se?.[0].includes("/")){let me=oe.end+se[0].length-1;return Z.slice(0,oe.start)+Z.slice(oe.end,me)+Z.slice(me+1)}return yl(Z,oe)},P);return ts(Y,L),Y}function zc(P){qc(P);let L=es(P),H=L.find((oe)=>go(oe)),Y=[],Z=[];for(let oe of L){if(!go(oe))continue;try{let se=Yi(oe,"utf-8");if(!rs(ts(se,oe)))continue;an(oe,_h(se,oe)),Z.push(oe)}catch(se){Y.push(se instanceof Error?se.message:String(se))}}if(Y.length>0)throw Error(Y.join(`
`));return{path:Z[0]??H??_n(Xi(P),Zi[0]),alreadyInstalled:Z.length>0}}function Jt(P){let L=[];for(let H of P.openCodeVersion?.startsWith("2.")?Qi(P.environment):es(P.environment))if(Ih(H))try{let Y=Oh(H,"utf-8"),Z=yn(Y),oe=JSON.parse(Z);if(rs(oe)){let se=ns(P.openCodePluginListOutput);if(se)return{platform:"opencode",status:"disabled",method:"opencode api plugin.list",configPath:H,errors:[...L,se]};return{platform:"opencode",status:"configured",method:"plugin array",configPath:H,errors:L.length>0?L:void 0}}}catch(Y){L.push(`Failed to parse ${$h(H)}: ${Y instanceof Error?Y.message:String(Y)}`)}return{platform:"opencode",status:"n/a",errors:L.length>0?L:void 0}}import{join as Wc}from"node:path";var Zc="dist/pi/index.js",Yc=new Set([Zc,"index.js"]),Dh=/[*?[\]{}]/;function os(P){let L=P.env.get("PI_CODING_AGENT_DIR");return Wc(L?Nn(L,P.home):Wc(P.home,".pi","agent"),"settings.json")}function is(P){if(typeof P!=="string")return!1;return P==="npm:cc-safety-net"||P.startsWith("npm:cc-safety-net@")}function Nh(P){if(!Array.isArray(P)||P.length===0)return!1;if(!P.every((Y)=>typeof Y==="string"))return!1;let L=(Y)=>P.some((Z)=>Z.startsWith(Y)&&Z.slice(1).replace(/^\.[/\\]/,"")===Zc);if(L("-"))return!1;if(L("+"))return!0;let H=P.filter((Y)=>!/^[-+!]/.test(Y));return(H.length===0||H.some((Y)=>Yc.has(Y)))&&!P.some((Y)=>Y.startsWith("!")&&(Yc.has(Y.slice(1))||Dh.test(Y)))}function Xc(P){let L=os(P.environment),H=vn(L);if(H.kind==="unreadable")return{platform:"pi",status:"not-inspected"};if(H.kind==="missing")return{platform:"pi",status:"n/a"};let Y=Xe(H.value,"packages");if(!Array.isArray(Y))return{platform:"pi",status:"n/a"};let Z=Y.find((se)=>is(typeof se==="string"?se:Xe(se,"source")));if(Z===void 0)return{platform:"pi",status:"n/a"};let oe=Xe(Z,"extensions");if(oe!==void 0&&!Nh(oe))return{platform:"pi",status:"disabled",method:"package config",configPath:L,errors:["npm:cc-safety-net is installed but its extension is disabled in Pi settings"]};return{platform:"pi",status:"configured",method:"package config",configPath:L}}var Lh={amp:nl,"antigravity-cli":il,"claude-code":dl,codex:pl,"copilot-cli":_l,cursor:Hl,"deepseek-harness":Ul,devin:Wl,droid:rc,"gemini-cli":oc,"grok-build":mc,"hermes-agent":Rc,"kimi-code":po,openclaw:Mc,opencode:Jt,pi:Xc};function zt(P,L,H){let Y={...H,cwd:L,environment:P};return Er.map((Z)=>jh(Lh[Z](Y)))}function jh(P){if(P.status==="not-inspected")return{platform:P.platform,detected:!1,configured:!1,inspectionStatus:"not-inspected"};return{platform:P.platform,detected:P.status!=="n/a",configured:P.status==="configured",inspectionStatus:P.status!=="n/a"?"verified":P.errors&&P.errors.length>0?"failed":"not-applicable",method:P.method,configPath:P.configPath,configPaths:P.configPaths,errors:P.errors}}import{join as Fh}from"node:path";var Hh=Object.freeze([{command:"git reset --hard",description:"git reset --hard",expectBlocked:!0},{command:"rm -rf /",description:"rm -rf /",expectBlocked:!0},{command:"rm -rf ./node_modules",description:"rm in cwd (safe)",expectBlocked:!1}]),Mh=Object.freeze({state:"ready",diagnostics:Object.freeze([]),ruleMetadata:Object.freeze({}),policy:Object.freeze({rules:Object.freeze([]),transparentWrappers:Object.freeze([]),commandTools:Object.freeze([]),safety:Object.freeze({level:"standard"}),worktreeMode:!1,destructiveCommandProtectionEnabled:!0,destructiveCommandRuleOverrides:Object.freeze({}),destructiveCommandAllowPaths:Object.freeze([]),secretProtection:Object.freeze({enabled:!0,disabledRules:Object.freeze([]),denyPaths:Object.freeze([]),allowPaths:Object.freeze([])})})}),Uh={strict:!1,paranoidRm:!1,paranoidInterpreters:!1,worktreeMode:!1,effectiveLevel:"standard",capabilities:{fail_closed:{enabled:!1,source:"preset",sources:[]},paranoid_rm:{enabled:!1,source:"preset",sources:[]},paranoid_interpreters:{enabled:!1,source:"preset",sources:[]}}};function Qc(P){let L=Fh(P.tmpdir,"cc-safety-net-self-test"),H=Hh.map((Y)=>{let Z=B(P,l("self-test",{command:Y.command},{kind:"command",shell:"auto"},{configCwd:L,executionCwd:L},Y.command),{guard:{dependencies:{loadPolicySnapshot:()=>Mh,getModes:()=>Uh,findPolicyMutation:()=>null}},audit:{agent:"self-test",getSessionId:()=>{return}}}),oe=Y.expectBlocked?"blocked":"allowed",se=Z.decision.kind==="deny"?"blocked":"allowed";return{command:Y.command,description:Y.description,expected:oe,actual:se,passed:oe===se,reason:Z.decision.kind==="deny"?Z.decision.reason:void 0,ruleId:Z.decision.kind==="deny"?Z.decision.ruleId:void 0}});return{passed:H.filter((Y)=>Y.passed).length,failed:H.filter((Y)=>!Y.passed).length,total:H.length,results:H}}function ss(P){let L=mn({label:"doctor",booleans:{json:["--json"],skipUpdateCheck:["--skip-update-check"]}},P);if($n(L.errors))return null;return{json:L.flags.json,skipUpdateCheck:L.flags.skipUpdateCheck}}async function ed(P,L={}){let H=await tr(!L.json,()=>{let Y=Gh(P,L);return{ready:Y,finish:()=>Y}},()=>nr(),{loadingMessage:"Checking system status…"});if(L.json)console.log(JSON.stringify(H,null,2));else qh(H);return H.engineSelfTest.failed>0||H.findings.some((Y)=>Y.severity==="error")?1:0}async function Gh(P,L){let H=L.cwd??process.cwd(),Y=await Nr((Fe)=>Jt({environment:P,cwd:H,openCodeVersion:Fe}).status!=="n/a",void 0,H),Z=zt(P,H,{ampPluginListOutput:Y.ampPluginListOutput,codexPluginListOutput:Y.codexPluginListOutput,copilotCliVersion:Y.versions["copilot-cli"],openCodeVersion:Y.versions.opencode,openCodePluginListOutput:Y.openCodePluginListOutput}),oe=va(P,H),se=ba(P),me=R(P,{cwd:H}),he=me.policy,ke=_(he,P.env),Pe=K(he,ke.capabilities),Te=Ir(P,7),_e=Ya(P,H),Ae=[Lt(H),jt(P)].filter((Fe)=>Bh(Fe)),Le=L.skipUpdateCheck?{currentVersion:pn(),latestVersion:null,updateAvailable:!1}:await Bn(),We={hooks:Z,engineSelfTest:Qc(P),userConfig:oe.userConfig,projectConfig:oe.projectConfig,configState:Ve(me),effectiveRules:oe.effectiveRules,environment:se,effectiveSafety:{selectedPreset:he.safety.level,level:ke.effectiveLevel,capabilities:ke.capabilities,ruleOverrides:he.destructiveCommandRuleOverrides,weakenedRuleOverrides:Object.entries(Pe).filter(([,Fe])=>Fe.source==="rule_override"&&Fe.override==="off"&&Fe.inheritedEnabled&&Fe.changesInherited).map(([Fe])=>Fe),ruleCounts:{stored:Object.keys(he.destructiveCommandRuleOverrides).length,effective:Object.values(Pe).filter((Fe)=>Fe.changesInherited).length},...me.policyScopes?{policyScopes:me.policyScopes}:{}},..._e.length>0?{v2Leftovers:_e}:{},...Ae.length>0?{legacyConfigs:Ae}:{},posture:$a(P,oe.userConfig.path),activity:Te,update:Le,system:Y};return{...We,findings:ka(We)}}function qh(P){console.log(),console.log(xa(P.hooks)),console.log(),console.log(Pa(P.engineSelfTest)),console.log(),console.log(Sa(P)),console.log(),console.log(Ra(P.environment)),console.log(),console.log(Ea(P)),console.log(),console.log(Ta(P.findings)),console.log(),console.log(Aa(P.activity)),console.log(),console.log(Ia(P.system)),console.log(),console.log(_a(P.update)),console.log(Oa(P))}import{existsSync as Vh}from"node:fs";var Kh=/^[A-Za-z0-9_@%+=:,./-]+$/,nd="Usage: cc-safety-net explain [--json] [--cwd <path>] <command>";function as(P){let L=mn({label:"explain",booleans:{json:["--json"]},values:{cwd:["--cwd"]},positionals:"tail"},P);if($n(L.errors))return console.error(nd),console.error("Pass -- before a command that starts with dashes."),null;if(L.values.cwd!==void 0&&!Vh(L.values.cwd))return console.error(`Error: --cwd path does not exist: ${L.values.cwd}`),null;let H=L.positionals.length===1?L.positionals[0]:L.positionals.map((Y)=>Kh.test(Y)?Y:`'${Y.replaceAll("'","'\\''")}'`).join(" ");if(!H)return console.error("Error: No command provided"),console.error(nd),null;return{json:L.flags.json,cwd:L.values.cwd,command:H}}function td(P){if(P)return{dh:"=",dv:"|",dtl:"+",dtr:"+",dbl:"+",dbr:"+",h:"-",v:"|",tl:"+",tr:"+",bl:"+",br:"+",sh:"="};return{dh:"═",dv:"║",dtl:"╔",dtr:"╗",dbl:"╚",dbr:"╝",h:"─",v:"│",tl:"┌",tr:"┐",bl:"└",br:"┘",sh:"━"}}function rd(P,L){let Y=L-18;return[`${P.dtl}${P.dh.repeat(L)}${P.dtr}`,`${P.dv}  Command Analysis${" ".repeat(Y)}${P.dv}`,`${P.dbl}${P.dh.repeat(L)}${P.dbr}`]}function ls(P){return JSON.stringify(P)}function od(P,L=0){return`[${P.map((Y,Z)=>Ca(Y,Z,L)).join(",")}]`}function mr(P,L,H=70){let Y=P.split(" "),Z=[],oe="";for(let se of Y)if(oe&&oe.length+se.length+1>H)Z.push(oe),oe=se;else oe=oe?`${oe} ${se}`:se;if(oe)Z.push(oe);return Z.map((se,me)=>me===0?se:`${L}${se}`)}function id(P,L,H){let Y=[];switch(P.type){case"parse":return null;case"env-strip":return Y.push(""),Y.push(`STEP ${L} ${H.h} Strip environment variables`),Y.push(`  Removed: ${P.envVars.map((Z)=>`${Z}=<redacted>`).join(", ")}`),Y.push(`  Tokens:  ${ls(P.output)}`),{lines:Y,incrementStep:!0};case"leading-tokens-stripped":return Y.push(""),Y.push(`STEP ${L} ${H.h} Strip wrappers`),Y.push(`  Removed: ${P.removed.join(", ")}`),Y.push(`  Tokens:  ${ls(P.output)}`),{lines:Y,incrementStep:!0};case"shell-wrapper":return Y.push(""),Y.push(`STEP ${L} ${H.h} Detect shell wrapper`),Y.push(`  Wrapper: ${P.wrapper} -c`),Y.push(`  Inner:   ${P.innerCommand}`),{lines:Y,incrementStep:!0};case"interpreter":{if(Y.push(""),Y.push(`STEP ${L} ${H.h} Detect interpreter`),Y.push(`  Interpreter: ${P.interpreter}`),Y.push(`  Code:        ${P.codeArg}`),P.paranoidBlocked)Y.push("  Result:      ✗ BLOCKED (paranoid mode)");return{lines:Y,incrementStep:!0}}case"busybox":return Y.push(""),Y.push(`STEP ${L} ${H.h} Busybox wrapper`),Y.push(`  Subcommand: ${P.subcommand}`),{lines:Y,incrementStep:!0};case"transparent-wrapper":return Y.push(""),Y.push(`STEP ${L} ${H.h} Transparent wrapper`),Y.push(`  Wrapper: ${P.wrapper}`),Y.push(`  Tokens:  ${ls(P.output)}`),{lines:Y,incrementStep:!0};case"recurse":return{lines:[],incrementStep:!1};case"rule-check":{if(Y.push(""),Y.push(`STEP ${L} ${H.h} Match rules`),Y.push(`  Rule:   ${P.rule}()`),P.matched)Y.push("  Result: MATCHED");else Y.push("  Result: No match");return{lines:Y,incrementStep:!0}}case"worktree-relaxation":return Y.push(""),Y.push(`STEP ${L} ${H.h} Worktree relaxation`),Y.push(`  Mode:   ${n.worktree.name}`),Y.push(`  Git cwd: ${P.gitCwd}`),Y.push("  Result: Allowed local discard in linked worktree"),{lines:Y,incrementStep:!0};case"temp-root-relaxation":return Y.push(""),Y.push(`STEP ${L} ${H.h} Temp-root relaxation`),Y.push(`  Git cwd: ${P.gitCwd}`),Y.push("  Result: Allowed git discard in a temp-root repository"),{lines:Y,incrementStep:!0};case"tmpdir-check":return null;case"fallback-scan":{if(P.embeddedCommandFound)return Y.push(""),Y.push(`STEP ${L} ${H.h} Fallback scan`),Y.push(`  Found: ${P.embeddedCommandFound}`),{lines:Y,incrementStep:!0};return null}case"custom-rules-check":{if(P.rulesChecked){if(Y.push(""),Y.push(`STEP ${L} ${H.h} Custom rules`),P.matched)Y.push("  Result: MATCHED");else Y.push("  Result: No match");return{lines:Y,incrementStep:!0}}return null}case"cwd-change":return null;case"dangerous-text":{if(P.matched)return Y.push(""),Y.push(`STEP ${L} ${H.h} Dangerous text check`),Y.push(`  Token:  ${P.token}`),Y.push("  Result: MATCHED"),{lines:Y,incrementStep:!0};return null}case"strict-unparseable":return Y.push(""),Y.push(`STEP ${L} ${H.h} Strict mode check`),Y.push(`  Command: ${P.rawCommand}`),Y.push("  Result:  ✗ UNPARSEABLE"),{lines:Y,incrementStep:!0};case"segment-skipped":return null;case"error":return Y.push(""),Y.push(`ERROR: ${P.message}`),{lines:Y,incrementStep:!1};default:return P}}function cs(P,L){let H=td(L?.asciiOnly??!1),Y=58,Z=[],oe=1;Z.push(...rd(H,58)),Z.push("");let se=P.trace.steps.find((Le)=>Le.type==="error");if(se&&se.type==="error"){Z.push("ERROR"),Z.push(`  ${se.message}`),Z.push(""),Z.push("RESULT"),Z.push(`  Status: ${P.result==="blocked"?en.red("BLOCKED"):en.green("ALLOWED")}`),Z.push(""),Z.push("CONFIG");let Le=P.configSource??"none";return Z.push(`  Path: ${Le}`),Z.join(`
`)}let me=P.trace.steps.find((Le)=>Le.type==="parse");if(me&&me.type==="parse"){Z.push("INPUT"),Z.push(`  ${me.input}`),Z.push(""),Z.push(`STEP ${oe} ${H.h} Split shell commands`),oe++;for(let Le=0;Le<me.segments.length;Le++){let We=me.segments[Le];if(We){let Fe=Math.random();Z.push(`  Segment ${Le+1}: ${od(We,Fe)}`)}}}let he=P.trace.segments,ke=he.length>1;for(let Le of he){if(ke){Z.push("");let tn="";if(me&&me.type==="parse"){let Bo=me.segments[Le.index];if(Bo)tn=Bo.join(" ")}let on=54,ln=tn,nn=` Segment ${Le.index+1}: `,sn=" ";if(tn){if(nn.length+tn.length+sn.length>on){let bf=on-nn.length-sn.length;ln=`${tn.substring(0,bf-1)}…`}}let Pn=tn?`${nn}${ln}${sn}`:` Segment ${Le.index+1} `,hf=tn?`${nn}${en.cyan(ln)}${sn}`:Pn,Ks=58-Pn.length,Js=Math.floor(Ks/2),vf=Ks-Js;Z.push(`${H.sh.repeat(Js)}${hf}${H.sh.repeat(vf)}`)}if(Le.steps.find((tn)=>tn.type==="segment-skipped")){Z.push(""),Z.push("  (skipped — prior segment blocked)");continue}let Fe=!1,Ze=!1;for(let tn of Le.steps){let on=id(tn,oe,H);if(on){if(Ze=!0,tn.type==="recurse"){Z.push("");let ln=" RECURSING ",nn=58-ln.length-4;Z.push(`  ${H.tl}${H.h}${ln}${H.h.repeat(nn)}`),Z.push(`  ${H.v}`),Fe=!0;continue}for(let ln of on.lines)if(Fe)Z.push(`  ${H.v} ${ln}`);else Z.push(ln);if(on.incrementStep)oe++}}if(Fe)Z.push(`  ${H.v}`),Z.push(`  ${H.bl}${H.h.repeat(56)}`);if(!Ze)Z.push(""),Z.push(`  ${en.green("✓")} Allowed (no matching rules)`)}if(Z.push(""),Z.push("RESULT"),P.result==="blocked"){if(Z.push(`  Status: ${en.red("BLOCKED")}`),P.customRule){if(Z.push(`  Rule: ${P.customRule.id}`),P.customRule.rulebook)Z.push(`  Rulebook: ${P.customRule.rulebook.name} ${P.customRule.rulebook.version}`);if(P.customRule.source)Z.push(`  Source: ${P.customRule.source}`);if(P.customRule.override)Z.push(`  Override: reason ${P.customRule.override.reason}`)}if(P.reason){let Le=mr(P.reason,"          ");Z.push(`  Reason: ${Le[0]}`);for(let We=1;We<Le.length;We++)Z.push(Le[We]??"")}}else Z.push(`  Status: ${en.green("ALLOWED")}`);Z.push(""),Z.push("CONFIG");let Pe=P.configSource??"none",Te=P.configValid?"":" (invalid)";Z.push(`  Path: ${Pe}${Te}`);let _e=P.safetyPresetScope;Z.push(`  Safety preset: ${P.selectedPreset??"standard"}${_e?` (${Or(_e)})`:""}`),Z.push(`  Effective capabilities: ${P.effectiveLevel}`);let Ae=Object.entries(P.destructiveCommandRuleOverrides??{});if(Z.push(`  Rule customizations: ${Ae.length}`),P.ruleActivation)Z.push(`  Rule activation: ${P.ruleActivation.id} — ${P.ruleActivation.enabled?"on":"off"} via ${P.ruleActivation.source}`);return Z.join(`
`)}function ds(P){return JSON.stringify(P,null,2)}import{resolve as Yh}from"node:path";var sd=512,ad={maxTextLength:2048,maxListLength:128,maxObjectProperties:128,maxDepth:16},Jh=["AKIA","ASIA","ghp_","gho_","ghu_","ghs_","ghr_","github_pat_","glpat-","xox","npm_","pypi-","rk_","sk-","sk_","gsk_","xai-","pplx-","bastn_","tgp_v1_","flp_","wfr_","fw_","fwp_","tp-","psk-"];function fs(P){let L=0,H={allocateSegment(){return L++},getNextSegmentIndex(){return L},branch(){let Y=P.fork(),Z=fs(Y);return{trace:Z,adopt(){P.replaceSegmentEvents(Y.finish().events),L=Z.getNextSegmentIndex()}}},recordGlobal(Y){P.record({scope:"global",step:Y})},recordSegment(Y,Z=H.currentSegmentIndex){if(Z===void 0)return;P.record({scope:"segment",segmentIndex:Z,step:Y})}};return H}function ms(P=new Set){let L=[];return{record(H){if(L.length>=sd)return;ho(H.step,P,ad),L.push({...H,step:us(H.step,ad,P)})},fork(){return ms(P)},replaceSegmentEvents(H){L.splice(0,L.length,...[...L.filter((Y)=>Y.scope==="global"),...H].slice(0,sd))},finish(){return{events:L}}}}function ho(P,L,H,Y=0,Z=new WeakSet){if(typeof P==="string"){let me=P.slice(0,H.maxTextLength);if(!rt(me))return;for(let he of vt(me))for(let ke of he.match(/[^\s"'()$]+/g)??[])L.add(ld(ke));return}if(!P||typeof P!=="object"||Y>=H.maxDepth||Z.has(P))return;if(Z.add(P),Array.isArray(P)){let me=Math.min(P.length,H.maxListLength);for(let he=0;he<me;he++)ho(P[he],L,H,Y+1,Z);return}let oe=0,se=new Set;for(let me in P){if(!Object.hasOwn(P,me))continue;if(oe>=H.maxObjectProperties)break;oe++,ho(me,L,H);let he=ps(me,H,L);if(se.has(he))continue;se.add(he),ho(P[me],L,H,Y+1,Z)}}function us(P,L,H,Y=0,Z=new WeakSet){if(typeof P==="string")return ps(P,L,H);if(!P||typeof P!=="object")return P;if(Y>=L.maxDepth)return;if(Z.has(P))return;if(Z.add(P),Array.isArray(P)){let me=[],he=Math.min(P.length,L.maxListLength);for(let ke=0;ke<he;ke++)me.push(us(P[ke],L,H,Y+1,Z));return me}let oe={},se=0;for(let me in P){if(!Object.hasOwn(P,me))continue;if(se>=L.maxObjectProperties)break;se++;let he=ps(me,L,H);if(Object.hasOwn(oe,he))continue;Object.defineProperty(oe,he,{value:us(P[me],L,H,Y+1,Z),enumerable:!0,configurable:!0,writable:!0})}return oe}function ps(P,L,H){let Y=P.slice(0,L.maxTextLength),Z=rt(Y)?nt(Y):Y,oe=H.size>0?Wh(Z,H):Z;return(zh(oe)?Me(oe):oe).slice(0,L.maxTextLength)}function zh(P){return P.includes("PRIVATE KEY")||P.includes("://")||P.includes("eyJ")||P.includes(":")&&/(?:authorization|cookie|x-api-key|api-key|(?:^|\s)(?:-u|--user)(?:\s|=))/i.test(P)||P.length>=14&&Jh.some((L)=>P.includes(L))||P.length>=49&&/\b[a-f0-9]{32}\.[A-Za-z0-9]{16}\b/.test(P)}function Wh(P,L){return P.replace(/[^\s"'()$]+/g,(H)=>L.has(ld(H))?"<redacted>":H)}function ld(P){let L=2166136261,H=2166136261;for(let Y=0;Y<P.length;Y++)L=Math.imul(L^P.charCodeAt(Y),16777619),H=Math.imul(H^P.charCodeAt(P.length-Y-1),16777619);return`${L>>>0}:${H>>>0}:${P.length}`}function gr(P,L={},H){let Y=Yh(L.cwd??process.cwd()),Z=L.policySnapshot??R(H,{cwd:Y,userConfigDir:L.userConfigDir}),oe=_(Z.policy,H.env),se=qe({policySnapshot:Z,effectiveCapabilities:oe.capabilities,worktreeMode:oe.worktreeMode}),me={effectiveLevel:se.effectiveLevel,selectedPreset:Z.policy.safety.level,...Z.policyScopes?{safetyPresetScope:Z.policyScopes.levelScope}:{},effectiveCapabilities:se.effectiveCapabilities,destructiveCommandRuleOverrides:Z.policy.destructiveCommandRuleOverrides},{configSource:he,configValid:ke}=Xh(H,{cwd:Y,userConfigDir:L.userConfigDir});if(!P||!P.trim())return{trace:{steps:[{type:"error",message:"No command provided"}],segments:[]},result:"allowed",configSource:he,configValid:ke,...me};let Pe=v(P,"auto");if(Pe.status==="limited")throw new b;let Te=Pe.dialect==="powershell"?v(P,"posix"):Pe,_e=Rt(Te),Ae=ms(),Le=fs(Ae);Le.recordGlobal({type:"parse",input:P,segments:_e.map((Pn)=>[...Pn])});let We=l("Bash",{command:P},{kind:"command",shell:"auto"},{configCwd:Y,executionCwd:Y},P),Fe=U(We,{environment:H,trace:Le,dependencies:{loadPolicySnapshot:()=>Z}}),Ze=Fe.decision.kind==="deny"?Fe.decision:null;if(Ze&&(Fe.stage==="policy-protection"||Fe.stage==="secret-protection"))return{trace:{steps:[],segments:[{index:0,steps:[{type:"rule-check",rule:Zh(Ze),matched:!0,reason:Ze.reason}]}]},result:"blocked",reason:T(Ze.reason),segment:T(cd(Ze,P)),ruleId:T(Ze.ruleId),configSource:he,configValid:ke,...me};let tn=Le.getNextSegmentIndex();if(Ze&&tn>0&&tn<_e.length)Le.recordSegment({type:"segment-skipped",index:tn,reason:"prior-segment-blocked"},tn);let on=Ae.finish(),ln=Ze?.ruleId??Qh(We,Z,oe,H),nn=q.find((Pn)=>Pn.id===ln&&Pn.activationCapability),sn=nn?se.policy.effectiveDestructiveCommandRules[nn.id]:void 0;return{trace:nv(on),result:Ze?"blocked":"allowed",reason:Ze?T(Ze.reason):void 0,segment:Ze?T(cd(Ze,P)):void 0,ruleId:Ze?T(Ze.ruleId):void 0,customRule:ev(tv(Ze?.ruleId,Z)),configSource:he,configValid:ke,...me,...nn&&sn?{ruleActivation:{id:nn.id,...sn}}:{}}}function cd(P,L){return P.evidence?.segment??L}function Zh(P){if(P.reason===Je)return"policy-protection:findPolicyConfigMutationTargetInSemanticFacts";if(P.reason===Ke)return"policy-apply-protection:findPolicyApplyInvocationInSemanticFacts";if(P.reason===g)return"git-metadata-protection:findGitMetadataMutationTargetInSemanticFacts";return"secret-protection:findSensitiveTargetInSemanticFacts"}function Xh(P,L){let H=A(L.cwd),Y=z(P,L),Z=Q(P,{cwd:L.cwd,userConfigDir:L.userConfigDir});try{if(r(Z.projectConfigTarget)!==null){if(Un(Z.projectConfigTarget).errors.length===0)return{configSource:H,configValid:!0};return{configSource:H,configValid:!1}}}catch(oe){if(oe instanceof o)return{configSource:H,configValid:!1};throw oe}try{if(r(Z.userConfigTarget)!==null){let oe=Un(Z.userConfigTarget);return{configSource:Y,configValid:oe.errors.length===0}}return{configSource:null,configValid:!0}}catch(oe){if(oe instanceof o)return{configSource:Y,configValid:!1};throw oe}}function Qh(P,L,H,Y){let Z=L.policy,oe=Ne({...Z,destructiveCommandProtectionEnabled:!0,destructiveCommandRuleOverrides:{...Z.destructiveCommandRuleOverrides,...Object.fromEntries(q.flatMap((me)=>me.activationCapability?[[me.id,"on"]]:[]))}},L.state==="degraded"?{diagnostics:L.diagnostics,reason:L.reason}:void 0),se=U(P,{environment:Y,dependencies:{loadPolicySnapshot:()=>oe,getModes:()=>({...H,strict:!0,paranoidRm:!0,paranoidInterpreters:!0,capabilities:{fail_closed:{...H.capabilities.fail_closed,enabled:!0},paranoid_rm:{...H.capabilities.paranoid_rm,enabled:!0},paranoid_interpreters:{...H.capabilities.paranoid_interpreters,enabled:!0}}}),findSensitiveTarget:()=>null}});return se.decision.kind==="deny"?se.decision.ruleId:void 0}function ev(P){if(!P)return;return{id:T(P.id),...P.rulebook?{rulebook:{name:T(P.rulebook.name),version:T(P.rulebook.version)}}:{},...P.source?{source:T(P.source)}:{},...P.override?{override:{type:"reason",reason:T(P.override.reason)}}:{}}}function nv(P){let L=P.events.flatMap((Y)=>Y.scope==="global"?[Y.step]:[]),H=new Map;for(let Y of P.events){if(Y.scope!=="segment")continue;let Z=H.get(Y.segmentIndex)??{index:Y.segmentIndex,steps:[]};Z.steps.push(Y.step),H.set(Y.segmentIndex,Z)}return{steps:L,segments:[...H.values()]}}function tv(P,L){let H=P?.replace(/^custom\./,"");if(!H||!L.policy.rules.some((Y)=>Y.name===H))return;return L.ruleMetadata[H]??Object.freeze({id:H})}function dd(P){return new Promise((L)=>{process.stdout.write(`${P}
`,()=>L())})}async function ud(P,L){let H=as(L);if(!H)return 1;try{let Y=gr(H.command,{cwd:H.cwd},P),Z=!!process.env.NO_COLOR||!process.stdout.isTTY;return await dd(H.json?ds(Y):cs(Y,{asciiOnly:Z})),0}catch(Y){let Z=rv(Y instanceof f?Y.cause:Y);if(Z===void 0)throw Y;if(H.json)return await dd(JSON.stringify({error:Z})),1;return console.error(Z),1}}function rv(P){if(P instanceof b)return P.message;if(P instanceof j)return P.message;if(P instanceof m)return P.message;if(P instanceof s&&a[P.kind].errorCode==="path-canonicalization-limit")return"Path canonicalization work limit exceeded.";return}var pd="2.6.16",En="  ",St="cc-safety-net";function fd(P){return P.argument?`${P.flags} ${P.argument}`:P.flags}function ov(P){return Math.max(...P.map((L)=>fd(L).length))}function iv(P){return Math.max(...P.map((L)=>L.usage.length))}function sv(P){return Math.max(...P.map((L)=>`${St} ${L.usage}`.length))}function av(P,L){let H=`${St} ${P.usage}`;return`${En}${H.padEnd(L+2)}${P.description}`}function In(P,L){return`${En}${P.padEnd(Math.max(40,P.length+2))}${L}`}function Wt(P,L=console.log){let H=[];if(H.push(`${St} ${P.name}`),H.push(""),H.push(`${En}${P.description}`),H.push(""),H.push("USAGE:"),H.push(`${En}${St} ${P.usage}`),H.push(""),P.subcommands&&P.subcommands.length>0){H.push("SUBCOMMANDS:");let Y=iv(P.subcommands);for(let Z of P.subcommands)H.push(`${En}${Z.usage.padEnd(Y+2)}${Z.description}`);H.push("")}if(P.options.length>0){H.push("OPTIONS:");let Y=ov(P.options);for(let Z of P.options){let oe=fd(Z),se=Z.default?`${Z.description} (default: ${Z.default})`:Z.description;H.push(`${En}${oe.padEnd(Y+2)}${se}`)}H.push("")}if(P.examples&&P.examples.length>0){H.push("EXAMPLES:");for(let Y of P.examples)H.push(`${En}${Y}`)}L(H.join(`
`))}function gs(){let P=sv(Ar),L=[];L.push(`${St} v${pd}`),L.push(""),L.push("Blocks destructive commands and secret access."),L.push(""),L.push("COMMANDS:");for(let H of Ar)L.push(av(H,P));L.push(""),L.push("GLOBAL OPTIONS:"),L.push(`${En}-h, --help       Show help (use with command for command-specific help)`),L.push(`${En}-V, --version    Show version`),L.push(""),L.push("HELP:"),L.push(`${En}${St} help <command>     Show help for a specific command`),L.push(`${En}${St} <command> --help   Show help for a specific command`),L.push(""),L.push("ENVIRONMENT VARIABLES:"),L.push(In(`${n.level.name}=standard|strict|paranoid`,"Set session safety level")),L.push(In(`${n.worktree.name}=1`,"Allow local git discards in linked worktrees")),L.push(In(`${n.debug.name}=1`,"Print diagnostic messages to stderr")),L.push(In(`${n.auditScope.name}=all|blocked`,"Record all command decisions, or denials only")),L.push(In(`${n.projectTightenOnly.name}=1`,"Ignore project policy settings that weaken the user policy")),L.push(In("CC_SAFETY_NET_HOME","Override rule config home directory")),L.push(""),L.push("LEGACY ENVIRONMENT VARIABLES (STILL SUPPORTED):"),L.push(In(`${n.strict.name}=1`,"Force safety.overrides.fail_closed on")),L.push(In(`${n.paranoid.name}=1`,"Force paranoid_rm and paranoid_interpreters on")),L.push(In(`${n.paranoidRm.name}=1`,"Force safety.overrides.paranoid_rm on")),L.push(In(`${n.paranoidInterpreters.name}=1`,"Force safety.overrides.paranoid_interpreters on")),L.push(""),L.push("Documentation:        https://ccsafetynet.com/docs"),console.log(L.join(`
`))}function md(){console.log(pd)}function yr(P,L=console.log){let H=_r(P);if(!H)return!1;if(H.name.toLowerCase()!==P.toLowerCase())return!1;return Wt(H,L),!0}import{existsSync as So,readFileSync as wu}from"node:fs";import{join as Po}from"node:path";import*as Vn from"node:readline";function lv(P){return P==="install"?"Install":"Uninstall"}function cv(P){return P==="install"?"Installing":"Uninstalling"}function dv(P){return P==="install"?"into":"from"}function hd(P){return P?.available===!0}function uv(P,L){let H=new Set(L);return P.filter((Y)=>H.has(Y.target)).map((Y)=>Y.target)}function gd(P,L,H){if(P.every((Y)=>!Y.available))return L;return Array.from({length:P.length},(Y,Z)=>Z+1).map((Y)=>(L+Y*H+P.length)%P.length).find((Y)=>hd(P[Y]))}function pv(P,L,H){if(H.ctrl&&H.name==="c")return"interrupt";if(H.name==="escape"||L==="q")return"abort";if(P==="install"&&(L==="u"||L==="U"))return"update";if(H.name==="up"||L==="k")return"up";if(H.name==="down"||L==="j")return"down";if(H.name==="space"||L===" ")return"toggle";if(H.name==="return"||H.name==="enter")return"confirm";return null}function fv(P){return{cursor:P.findIndex((L)=>L.available),selected:[]}}function mv(P,L,H){if(H==="confirm"||H==="update"||H==="abort"||H==="interrupt")return{state:P,done:H};if(H==="up")return{state:{...P,cursor:gd(L,P.cursor,-1)}};if(H==="down")return{state:{...P,cursor:gd(L,P.cursor,1)}};let Y=L[P.cursor];if(!hd(Y))return{state:P};let Z=P.selected.includes(Y.target)?P.selected.filter((oe)=>oe!==Y.target):uv(L,[...P.selected,Y.target]);return{state:{...P,selected:Z}}}var vd="◉",bd="◯",wd=">",kd=" ";function gv(P,L,H){return["",`${lv(P)} CC Safety Net ${dv(P)}:`,"",...L.map((Y,Z)=>{let oe=H.selected.includes(Y.target),se=Z===H.cursor,me=oe?vd:bd,he=se?wd:kd,ke=Y.available?"":` (${Y.unavailableReason??"not installed"})`,Pe=`${me} ${Y.label}${ke}`,Te=!Y.available?en.dim(Pe):oe?en.green(Pe):se?en.bold(Pe):Pe;return`${he} ${Te}`}),"",P==="install"?"Space: select  Enter: confirm  u: update installed  Up/Down: move  q/Esc: cancel":L.some((Y)=>Y.available)?"Space: select  Enter: confirm  Up/Down: move  q/Esc: cancel":`No selectable integrations found for ${P}. q/Esc: close`].join(`
`)}var yd=["global-hook","plugin"];function yv(P,L,H={}){let Y=H.color!==!1?en.bold:(oe)=>oe;return["","Install the Kimi Code integration as:","",...[`Global hook — ${L?"already installed; selecting it reports the current state":"write the hook into ~/.kimi-code/config.toml now"}`,"Native Kimi plugin — print the steps to run inside Kimi Code"].map((oe,se)=>{let me=se===P,he=`${me?vd:bd} ${oe}`;return`${me?wd:kd} ${me?Y(he):he}`}),"","Enter: confirm  Up/Down: move  q/Esc: cancel"].join(`
`)}function Cd(P){let{input:L,output:H}=P;Vn.emitKeypressEvents(L);let Y=L.isRaw===!0;L.setRawMode(!0),L.resume();let Z=0,oe=()=>{if(Z===0)return;Vn.moveCursor(H,0,-Z),Vn.cursorTo(H,0),Vn.clearScreenDown(H)},se=()=>{oe();let me=P.render();H.write(`${me}
`),Z=me.split(`
`).length};return new Promise((me)=>{let he=(Pe)=>{L.off("keypress",ke),L.setRawMode(Y),L.pause(),oe(),me(Pe)};function ke(Pe,Te){P.onKey(Pe,Te,{finish:he,draw:se})}L.on("keypress",ke),se()})}function xd(P={}){let L=0;return Cd({input:P.input??process.stdin,output:P.output??process.stdout,render:()=>yv(L,P.globalHookInstalled===!0),onKey:(H,Y,Z)=>{if(Y.ctrl&&Y.name==="c"){Z.finish(null),(P.onInterrupt??(()=>process.kill(process.pid,"SIGINT")))();return}if(Y.name==="escape"||H==="q")return Z.finish(null);if(Y.name==="return"||Y.name==="enter")return Z.finish(yd[L]);if(Y.name==="up"||Y.name==="down"||H==="k"||H==="j")L=(L+1)%yd.length,Z.draw()}})}function ys(P=process.stdin,L=process.stdout){return Boolean(P.isTTY&&L.isTTY&&typeof P.setRawMode==="function")}function Pd(P,L,H={}){let Y=H.output??process.stdout,Z=fv(L);return Cd({input:H.input??process.stdin,output:Y,render:()=>gv(P,L,Z),onKey:(oe,se,me)=>{let he=pv(P,oe,se);if(!he)return;let ke=mv(Z,L,he);if(Z=ke.state,ke.done==="interrupt"){me.finish(null),(H.onInterrupt??(()=>process.kill(process.pid,"SIGINT")))();return}if(ke.done==="abort")return me.finish(null);if(ke.done==="update")return me.finish("update");if(ke.done==="confirm"){if(Z.selected.length===0){Y.write("\x07"),me.draw();return}me.finish([...Z.selected]),Y.write(`${cv(P)} selected integrations...
`);return}me.draw()}})}import{existsSync as Sd,lstatSync as vv,mkdirSync as bv,mkdtempSync as wv,readdirSync as kv,readFileSync as Zt,rmSync as bo}from"node:fs";import{basename as Cv,dirname as xv,join as Cn}from"node:path";import{fileURLToPath as Pv}from"node:url";var hs="// cc-safety-net managed Amp plugin. Do not edit. Reinstall with: npx -y cc-safety-net install --amp",Tt="cc-safety-net",At="cc-safety-net/index.ts";import{spawn as hv}from"node:child_process";var vs=(P,L)=>{let H=Xn([...P],process.env);return new Promise((Y)=>{let Z=hv(H.cmd,H.args,{cwd:L,stdio:["ignore","pipe","pipe"]}),oe=ui(Z),se=!1,me=setTimeout(()=>{se=!0,Z.kill()},120000);Z.on("error",(he)=>{clearTimeout(me),Y({status:null,errorCode:he.code,stdout:oe.stdout,stderr:[he.message,oe.stderr].filter(Boolean).join(`
`)})}),Z.on("close",(he)=>{clearTimeout(me),Y({status:se?null:he,errorCode:se?"ETIMEDOUT":void 0,stdout:oe.stdout,stderr:oe.stderr})})})};var Yt="cc-safety-net.ts",bs=Cn("amp",At);function Sv(P){return Cn(P.home,".config","amp","plugins","cc-safety-net.ts")}function Rv(){let P=xv(Pv(import.meta.url)),L=Cn(P,bs),H=Cn(P,"..",bs),Y=Cn(P,"..","..","..","dist",bs);return[L,H,Y]}function Ev(P=Rv()){let L=P.find((H)=>Sd(H)&&vv(H).isFile());if(!L)throw Error("Packaged Amp plugin artifact not found. Reinstall cc-safety-net and try again.");return L}function Rd(P){try{return JSON.parse(P)}catch{return}}function wo(P){return P.subarray(0,Buffer.byteLength(hs)).toString("utf-8")===hs}async function hr(P,L,H){let Y=await P(L,H);if(Y.status===0)return Y;throw Error([`Failed to run ${L.join(" ")}${Y.status===null?"":` (exit ${Y.status})`}.`,[Y.stdout,Y.stderr].filter(Boolean).join(`
`).trim()].filter(Boolean).join(`
`))}async function Ed(P){let L=await P(["amp","plugins","repositories","--json"]);if(L.status===null)throw Error(`${L.errorCode==="ENOENT"?'Amp CLI not found. Install the amp CLI, sign in with "amp login", and rerun install --amp.':`amp plugins repositories --json did not finish (${L.errorCode??"terminated"}). Check that the amp CLI responds and rerun install --amp.`}
${L.stderr}`.trim());if(L.status!==0)throw Error(`Failed to run amp plugins repositories --json (exit ${L.status}). Sign in with "amp login" and rerun install --amp.
${[L.stdout,L.stderr].filter(Boolean).join(`
`)}`.trim());let H=Rd(L.stdout),Y=(Array.isArray(H)?H:[]).filter((Z)=>Xe(Z,"scope")==="user"&&Xe(Z,"exists")===!0&&Xe(Z,"viewerCanWrite")===!0).map((Z)=>Xe(Z,"cloneRef")).find((Z)=>typeof Z==="string"&&Z.length>0);if(!Y)throw Error('Your Amp account has no writable Personal Plugins repository. Sign in with "amp login", open Amp once to create it, and rerun install --amp.');return Y}async function Td(P,L,H){let Y=wv(Cn(L.tmpdir,"cc-safety-net-amp-"));try{return await hr(P,["amp","clone","user-plugins",Y]),await H(Y)}finally{bo(Y,{recursive:!0,force:!0})}}function ws(P){return`rerun ${P==="overwrite"?"install":"uninstall"} --amp`}function Ad(P,L,H){let Y=Cn(P,L),Z=dn(Y);if(!Z)return;if(Z.isSymbolicLink()||!Z.isFile())throw Error(`Refusing to ${H} ${L} in your Amp personal plugins repository: not a regular file. Remove it there and ${ws(H)}.`);let oe=Zt(Y);if(wo(oe))return oe;throw Error(`Refusing to ${H} unmanaged file ${L} in your Amp personal plugins repository. Remove it there and ${ws(H)}.`)}function _d(P,L){let H=Cn(P,Tt),Y=dn(H);if(!Y)return;if(Y.isSymbolicLink()||!Y.isDirectory())throw Error(`Refusing to ${L} ${Tt} in your Amp personal plugins repository: not a regular directory. Remove it there and ${ws(L)}.`);return Ad(P,At,L)}function Tv(P){let L=Cn(P,Yt),H=dn(L);if(!H||H.isSymbolicLink()||!H.isFile())return;let Y=Zt(L);return wo(Y)?Y:void 0}async function Id(P,L,H,Y){if(await hr(P,H,L),(await hr(P,["git","status","--porcelain"],L)).stdout.trim()==="")return!1;return await hr(P,["git","-c","commit.gpgsign=false","-c","user.name=cc-safety-net","-c","user.email=cc-safety-net@localhost","commit","-m",Y],L),await hr(P,["git","push","origin","HEAD"],L),!0}function vo(P,L){Av(P,L),_v(P,L)}function Od(P,L){if(L==="keep")return;throw Error(`Local Amp plugin ${P} is not a managed copy and masks the personal plugin. Remove it and rerun install --amp.`)}function Av(P,L){let H=Sv(P),Y=dn(H);if(!Y)return;if(!Y.isSymbolicLink()&&Y.isFile()&&wo(Zt(H))){bo(H);return}Od(H,L)}function _v(P,L){let H=Cn(P.home,".config","amp","plugins",Tt),Y=dn(H);if(!Y)return;if(!Y.isSymbolicLink()&&Y.isDirectory()&&Iv(H)){bo(H,{recursive:!0});return}Od(H,L)}function Iv(P){let L=Cv(At);if(kv(P).join("\x00")!==L)return!1;let H=Cn(P,L),Y=dn(H);return!!Y&&!Y.isSymbolicLink()&&Y.isFile()&&wo(Zt(H))}function Ov(P){let L=u(P);if(!Sd(L))return"";let H=Rd(Zt(L,"utf-8"));if(!H||typeof H!=="object"||Array.isArray(H))return"";return`;globalThis.__CC_SAFETY_NET_EMBEDDED_POLICY__ = ${JSON.stringify(k(H,P.home))};
`}async function $d(P,L=Ev(),H=vs){let Y=Buffer.concat([Zt(L),Buffer.from(Ov(P),"utf-8")]),Z=await Ed(H);return Td(H,P,async(oe)=>{let se=`${Z}/${Tt}`,me=_d(oe,"overwrite"),he=Ad(oe,Yt,"overwrite");if(me?.equals(Y)&&!he)return vo(P,"fail"),{path:se,alreadyInstalled:!0};if(bv(Cn(oe,Tt),{recursive:!0}),an(Cn(oe,At),Y),he)bo(Cn(oe,Yt));let ke=await Id(H,oe,["git","add","--",At,...he?[Yt]:[]],`chore: update cc-safety-net plugin to v${pn()}`);return vo(P,"fail"),{path:se,alreadyInstalled:!ke}})}async function Dd(P,L=vs){let H=await Ed(L);return Td(L,P,async(Y)=>{let Z=_d(Y,"remove"),oe=Tv(Y),se=`${H}/${oe&&!Z?Yt:Tt}`;if(!Z&&!oe)return vo(P,"keep"),{path:se,alreadyInstalled:!1};return await Id(L,Y,["git","rm","--",...Z?[At]:[],...oe?[Yt]:[]],`chore: remove cc-safety-net plugin v${pn()}`),vo(P,"keep"),{path:se,alreadyInstalled:!0}})}import{existsSync as Nd,mkdirSync as $v,readFileSync as Dv}from"node:fs";import{dirname as Nv}from"node:path";var ks=kn["antigravity-cli"],_t="cc-safety-net";function It(P){return Boolean(P)&&typeof P==="object"&&!Array.isArray(P)}function Co(){return{PreToolUse:[{hooks:[{type:"command",command:ks,timeout:30}]}]}}function Ld(P){try{let L=JSON.parse(Dv(P,"utf-8"));if(!L||typeof L!=="object"||Array.isArray(L))throw Error("Antigravity hooks config must be a JSON object");return L}catch(L){if(L instanceof SyntaxError)throw Error(`Failed to parse Antigravity hooks config ${P}: ${L.message}`);throw L}}function jd(P){let L=P[_t];if(L===void 0){let Y=Co();return P[_t]=Y,{definition:Y,preToolUse:Y.PreToolUse??[]}}if(!It(L))throw Error(`Antigravity hooks config entry "${_t}" must be an object`);let H=Array.isArray(L.PreToolUse)?L.PreToolUse:[];return L.PreToolUse=H,{definition:L,preToolUse:H}}function Fd(P){if(!Array.isArray(P.PreToolUse))return!1;return P.PreToolUse.some((L)=>It(L)&&Array.isArray(L.hooks)&&L.hooks.some((H)=>It(H)&&H.command===ks))}function Lv(P){return Object.values(P).some((L)=>It(L)&&L.enabled!==!1&&Fd(L))}function jv(P){if(P[_t]===void 0)return!1;let L=jd(P);if(L.definition.enabled!==!1||!Fd(L.definition))return!1;return L.definition.enabled=!0,!0}function Fv(P){if(P[_t]===void 0){P[_t]=Co();return}let L=jd(P);L.definition.enabled=!0,L.preToolUse.push(Co().PreToolUse?.[0]??{hooks:[]})}function Hv(P){let L=!1;for(let H of Object.values(P)){if(!It(H)||!Array.isArray(H.PreToolUse))continue;H.PreToolUse=H.PreToolUse.flatMap((Y)=>{if(!It(Y)||!Array.isArray(Y.hooks))return[Y];let Z=Y.hooks.filter((oe)=>!It(oe)||oe.command!==ks);if(Z.length!==Y.hooks.length)L=!0;return Z.length===0?[]:[{...Y,hooks:Z}]})}return L}function ko(P,L){an(P,`${JSON.stringify(L,null,2)}
`)}function Hd(P){let L=rr(P.home);if($v(Nv(L),{recursive:!0}),!Nd(L))return ko(L,{[_t]:Co()}),{path:L,alreadyInstalled:!1};let H=Ld(L);if(Lv(H))return{path:L,alreadyInstalled:!0};if(jv(H))return ko(L,H),{path:L,alreadyInstalled:!1};return Fv(H),ko(L,H),{path:L,alreadyInstalled:!1}}function Md(P){let L=rr(P.home);if(!Nd(L))return{path:L,alreadyInstalled:!1};let H=Ld(L);if(!Hv(H))return{path:L,alreadyInstalled:!1};return ko(L,H),{path:L,alreadyInstalled:!0}}import{existsSync as Ps,readlinkSync as Bv}from"node:fs";import{join as Kn}from"node:path";import{spawn as Mv}from"node:child_process";var On=Rn.map((P)=>({target:P.id,flag:P.flag,label:cn(P.id),probeCommand:P.probeCommand}));function Cs(P){let L=new Set(P);return On.map((H)=>H.target).filter((H)=>L.has(H))}async function Ud(P,L){for(let H of P)await L(H)}var Uv=5000;function vr(P,L=Uv){return new Promise((H)=>{let Y=Xn([...P],process.env),Z=Mv(Y.cmd,Y.args,{env:process.env,stdio:"ignore"}),oe=!1,se=(he)=>{if(oe)return;oe=!0,clearTimeout(me),H(he)},me=setTimeout(()=>{Z.kill(),se(!1)},L);Z.on("error",()=>se(!1)),Z.on("close",(he)=>se(he===0))})}function Bd(P=vr,L={}){let H=new Set(L.configuredTargets??[]);return Promise.all(On.map(async(Y)=>({target:Y.target,flag:Y.flag,label:Y.label,...qd(L.action,await P(Y.probeCommand)||Y.target==="cursor"&&await P(ia),H.has(Y.target))})))}function Gd(P,L){let H=new Set(L.configuredTargets??[]);return P.map((Y)=>({...Y,...qd(L.action,Y.available,H.has(Y.target))}))}function qd(P,L,H){if(P==="uninstall")return H?{available:!0}:{available:!1,unavailableReason:"not installed"};if(P==="install"&&H)return{available:!1,unavailableReason:"already installed"};if(!L)return{available:!1,unavailableReason:"CLI not installed"};return{available:!0}}var Jn="cc-safety-net",zd=["npx","-y","@deepseek-ai/dsh"],Vd="DeepSeek Harness",Kd=["@deepseek-ai","dsh-desktop"],Wd="Quit DeepSeek Harness Desktop, then run this command again: Desktop plugins can only change while it is closed.",xs=(P)=>`DeepSeek Harness Desktop is not in its default location, so ${P} ${Jn} from its Plugins page.`,Yd=(P,L)=>Ps(Kn(ki(P),L,"package.json"));function Ss(P,L){let H=L.platform??process.platform,Y=Yd(P,"desktop"),Z=H==="darwin"?[Kn(P.home,"Applications"),L.systemApplications??"/Applications"].map((oe)=>Kn(oe,`${Vd}.app`,"Contents","Resources","runtime","cli","bin","dsh")):H==="win32"?[Kn(P.env.get("LOCALAPPDATA")||Kn(P.home,"AppData","Local"),"Programs",Vd,"resources","runtime","cli","bin","dsh.cmd")]:[];return{profile:Y,cli:Y?Z.find((oe)=>Ps(oe)):void 0}}function Zd(P,L=process.platform){if(L==="win32")return Ps(Kn(P.env.get("APPDATA")||Kn(P.home,"AppData","Roaming"),...Kd,"lockfile"));let H=Gv(Kn(P.home,"Library","Application Support",...Kd,"SingletonLock")),Y=Number(/-(\d+)$/.exec(H??"")?.[1]);return Number.isInteger(Y)&&Y>0&&qv(Y)}function Gv(P){try{return Bv(P)}catch{return}}function qv(P){try{return process.kill(P,0),!0}catch(L){return L.code==="EPERM"}}async function Xd(P,L={}){let H=Ss(P,L);if(H.cli&&Zd(P,L.platform))throw Error(Wd);let Y=!H.cli||Yd(P,"web")||await(L.probe??vr)(qo),Z=[...H.cli?[{profile:"desktop",label:"Desktop",dsh:[H.cli]}]:[],...Y?[{profile:"web",label:"web",dsh:zd}]:[]];return{commands:Z.map((oe)=>[...oe.dsh,"plugin","--profile",oe.profile,"add",`${Jn}@${pn()}`]),afterInstall:async()=>{let oe=new Set(Ci(P).filter((me)=>me.enabled).map((me)=>me.name)),se=Z.filter((me)=>!oe.has(me.profile));if(se.length>0)throw Error(`DeepSeek Harness installed ${Jn} in the ${Jd(se)} but did not enable it. Enable it from the Plugins page.`)},message:[`Added ${Jn} to the DeepSeek Harness ${Jd(Z)}.`,...H.profile&&!H.cli?[xs("add")]:[]].join(`
`)}}function Jd(P){return`${P.map((L)=>L.label).join(" and ")} profile${P.length>1?"s":""}`}function Qd(P,L={}){let H=new Set(Ci(P).map((oe)=>oe.name));if(!H.has("desktop")&&!H.has("web"))throw Error(`${Jn} is not installed in the DeepSeek Harness web or Desktop profile`);let Y=H.has("desktop")?Ss(P,L).cli:void 0,Z=H.has("desktop")&&!Y;if(Z&&!H.has("web"))throw Error(xs("remove"));if(Y&&Zd(P,L.platform))throw Error(Wd);return{commands:[...Y?[[Y,"plugin","--profile","desktop","remove",Jn]]:[],...H.has("web")?[[...zd,"plugin","--profile","web","remove",Jn]]:[]],...Z?{afterUninstall:()=>{throw Error(`Removed ${Jn} from the DeepSeek Harness web profile, but ${xs("remove")}`)}}:{}}}function eu(P,L,H={}){let Y=Ss(L,H).cli!==void 0;return P.map((Z)=>Z.target==="deepseek-harness"&&Y?{...Z,available:!0,unavailableReason:void 0}:Z)}import{existsSync as Vv,readdirSync as Kv,rmSync as Jv}from"node:fs";import{join as zv}from"node:path";function nu(P,L=process.platform,H){if(!Vv(P))return;let Y=L==="win32"?/^bunx-\d+-cc-safety-net@/:new RegExp(`^bunx-${process.getuid?.()??0}-cc-safety-net@`);Kv(P).filter((Z)=>Z!==H&&Y.test(Z)).forEach((Z)=>{Jv(zv(P,Z),{recursive:!0,force:!0})})}import{existsSync as tu,readdirSync as Wv,rmSync as Yv}from"node:fs";import{join as Xt}from"node:path";function xo(P,L=process.platform){let H=Xt(P.env.get("npm_config_cache")||(L==="win32"?Xt(P.env.get("LOCALAPPDATA")||Xt(P.home,"AppData","Local"),"npm-cache"):Xt(P.home,".npm")),"_npx");if(!tu(H))return;Wv(H).filter((Y)=>tu(Xt(H,Y,"node_modules","cc-safety-net"))).forEach((Y)=>{Yv(Xt(H,Y),{recursive:!0,force:!0})})}import{existsSync as lu,mkdirSync as Xv,readFileSync as cu}from"node:fs";import{dirname as Qv,join as au}from"node:path";function Zv(P,L){if(P[L]!=="#")return L;let H=P.indexOf(`
`,L+1);return H===-1?P.length:H+1}function Rs(P,L,H){let Y=new RegExp(`^(\\s*)${L}\\s*=\\s*\\[`),Z=0;for(let oe of P.split(`
`)){if(/^\s*\[/.test(oe))return;let se=Y.exec(oe);if(se){let me=Z+se[0].lastIndexOf("[");return{start:me,end:li(P,me,{skipComment:Zv,...H})}}Z+=oe.length+1}return}function ru(P,L,H){let Y=P.slice(0,L.end).trimEnd(),Z=gl(P,L.end),oe=Z===""?"     ":`${Z}  `,se=!Y.endsWith("[")&&!Y.endsWith(",");return`${Y}${se?",":""}
${oe}${H}${P.slice(L.end)}`}function ou(P,L,H){let Y=P.indexOf(H,L.start);if(Y===-1||Y>L.end)return P;return`${P.slice(0,Y)}${P.slice(Y+H.length).replace(/^\s*,/,"")}`}function iu(P,L){let H=new RegExp(`^\\s*${L}\\s*=\\s*\\[\\s*]\\s*(?:#.*)?$`),Y=P.split(`
`),Z=Y.findIndex((me)=>/^\s*\[/.test(me)),oe=Z===-1?Y:Y.slice(0,Z),se=Z===-1?[]:Y.slice(Z);return[...oe.filter((me)=>!H.test(me)),...se].join(`
`)}function su(P,L,H){let Y=new RegExp(`^\\s*\\[\\[${L}]]\\s*$`,"m");return P.split(/(?=^\s*\[)/m).filter((Z)=>!Y.test(Z)||!Z.includes(H)).join("").trimEnd()}var br=kn["kimi-code"],Es=`[[hooks]]
event = "PreToolUse"
command = "${br}"`,du=`{ event = "PreToolUse", command = "${br}" }`,uu={stringError:"Unterminated string in Kimi Code config",bracketError:"Unmatched hooks array in Kimi Code config"};function pu(P){return au(P.env.get("KIMI_CODE_HOME")??au(P.home,".kimi-code"),"config.toml")}function eb(P){let L=Rs(P,"hooks",uu);if(L&&P.slice(L.start+1,L.end).trim())return ru(P,L,du);let H=iu(P,"hooks").trimEnd();if(H==="")return`${Es}
`;return`${H}

${Es}
`}function fu(P){let L=pu(P);if(Xv(Qv(L),{recursive:!0}),!lu(L))return an(L,`${Es}
`),{path:L,alreadyInstalled:!1};let H=cu(L,"utf-8");if(H.includes(br))return{path:L,alreadyInstalled:!0};return an(L,eb(H)),{path:L,alreadyInstalled:!1}}function mu(P){let L=pu(P);if(!lu(L))return{path:L,alreadyInstalled:!1};let H=cu(L,"utf-8");if(!H.includes(br))return{path:L,alreadyInstalled:!1};let Y=Rs(H,"hooks",uu),Z=Y?ou(H,Y,du):`${su(H,"hooks",br)}
`;return an(L,Z),{path:L,alreadyInstalled:!0}}var Ts="safety-net@cc-marketplace",gu=new Set(["claude-code","codex","copilot-cli","gemini-cli","hermes-agent","openclaw","opencode","pi"]),yu=new Set(["antigravity-cli","cursor","devin","droid","grok-build","hermes-agent","kimi-code"]);function As(P){return/^\s*safety-net@cc-marketplace[^a-z0-9-][^\n]*installed,/m.test(P??"")}function ku(P){return/^\s*cc-safety-net[^a-z0-9-][^\n]*installed,/m.test(P??"")}function nb(P){return/^Marketplace `cc-marketplace`\s*$/m.test(P??"")}var Cu={"claude-code":{installCommands:(P)=>{let L=Kr(P,"cc-safety-net@cc-marketplace");return{commands:[...L?[["claude","plugin","marketplace","update","cc-marketplace"],["claude","plugin","update","cc-safety-net@cc-marketplace"]]:[["claude","plugin","marketplace","add","kenryu42/cc-marketplace"],["claude","plugin","marketplace","update","cc-marketplace"],["claude","plugin","install","cc-safety-net@cc-marketplace"]],...si(P).status==="disabled"?[["claude","plugin","enable","cc-safety-net@cc-marketplace"]]:[]],cleanupCommands:Kr(P,Ts)?[["claude","plugin","uninstall",Ts]]:[],update:L}},uninstallCommands:[["claude","plugin","uninstall","cc-safety-net@cc-marketplace"],["claude","plugin","marketplace","remove","cc-marketplace"]]},codex:{installCommands:async(P,L)=>{let H=L??await fn(["codex","plugin","list"]),Y=ku(H);return{commands:[Y||nb(H)?["codex","plugin","marketplace","upgrade","cc-marketplace"]:["codex","plugin","marketplace","add","kenryu42/cc-marketplace"],["codex","plugin","add","cc-safety-net@cc-marketplace"]],cleanupCommands:As(H)?[["codex","plugin","remove","safety-net@cc-marketplace"]]:[],update:Y}},uninstallCommands:[["codex","plugin","remove","cc-safety-net@cc-marketplace"],["codex","plugin","marketplace","remove","cc-marketplace"]],postInstallMessage:ul},"copilot-cli":{installCommands:async()=>{let P=await fn(["copilot","plugin","list"]),L=[...xl(P)?[["copilot","plugin","uninstall","copilot-safety-net"]]:[],...Pl(P)?[["copilot","plugin","uninstall",wl]]:[]];if(kl(P))return{commands:[["copilot","plugin","marketplace","update","cc-marketplace"],["copilot","plugin","update",An]],cleanupCommands:L,update:!0};return{commands:[Cl(await fn(["copilot","plugin","marketplace","list"]))?["copilot","plugin","marketplace","update","cc-marketplace"]:["copilot","plugin","marketplace","add","kenryu42/cc-marketplace"],["copilot","plugin","install",An]],cleanupCommands:L}},uninstallCommands:[["copilot","plugin","uninstall","cc-safety-net@cc-marketplace"],["copilot","plugin","marketplace","remove","cc-marketplace"]]},"gemini-cli":{installCommands:(P)=>{let L=Oi(P);if(L.status==="configured")return{commands:[["gemini","extensions","update","gemini-safety-net"]],update:!0};if(L.status==="disabled")return{commands:[["gemini","extensions","update","gemini-safety-net"],["gemini","extensions","enable","gemini-safety-net"]],update:!0};return{commands:[["gemini","extensions","install","https://github.com/kenryu42/gemini-safety-net","--consent"]]}},uninstallCommands:[["gemini","extensions","uninstall","gemini-safety-net"]]},openclaw:{beforeInstall:Ji,installCommands:(P)=>{let L=!So(Po(ur(P),xn));return{commands:Dc(),afterInstall:()=>Nc(L)}},uninstallCommands:[["openclaw","plugins","uninstall",un,"--force"]],postInstallMessage:["Restart the OpenClaw Gateway to apply the change.","If plugins.allow is set in openclaw.json, it must also list cc-safety-net."].join(`
`)},opencode:{installCommands:Vc},pi:{installCommands:[["pi","install","npm:cc-safety-net"]],uninstallCommands:[["pi","uninstall","npm:cc-safety-net"]]},"deepseek-harness":{installCommands:(P)=>Xd(P),uninstallCommands:(P)=>Qd(P)}};function xu(P,L=(H)=>H){try{let H=JSON.parse(L(wu(P,"utf-8")));if(!H||typeof H!=="object"||Array.isArray(H))throw Error(`Settings file ${P} must be a JSON object`);return H}catch(H){if(H instanceof SyntaxError)throw Error(`Failed to parse ${P}: ${H.message}`);throw H}}function tb(P){let L=Po(sr(P),"settings.json");if(!So(L))return;let H=xu(L,yn),Y=H.enabledPlugins;if(!Y||typeof Y!=="object"||Array.isArray(Y))return;if(Y[An]!==!1)return;let Z=wu(L,"utf-8"),oe=Z.replace(new RegExp(`("${An}"\\s*:\\s*)false`),"$1true");return Y[An]=!0,an(L,oe!==Z?oe:`${JSON.stringify(H,null,2)}
`),`Enabled ${An} plugin in ${L}`}function rb(P){let L=os(P);if(!So(L))return;let H=xu(L);if(!Array.isArray(H.packages))return;let Y=H.packages.find((Z)=>!!Z&&typeof Z==="object"&&!Array.isArray(Z)&&is(Z.source)&&("extensions"in Z));if(!Y)return;return delete Y.extensions,an(L,`${JSON.stringify(H,null,2)}
`),`Enabled npm:cc-safety-net extensions in ${L}`}function hu(P,L){let H=mn({label:L,booleans:Object.fromEntries(On.map((oe)=>[oe.target,[oe.flag]]))},P),Y=H.errors[0];if(Y)throw Error(Y);let Z=On.filter((oe)=>H.flags[oe.target]).map((oe)=>oe.target);if(Z.length!==1)throw Error(`Choose exactly one ${L} target: ${On.map((oe)=>oe.flag).join(", ")}`);return Z[0]}async function Pu(P,L=Ft){let[H,Y,Z]=await Promise.all([L(["amp","plugins","list"],30000),L(["codex","plugin","list"],30000),L(["copilot","--binary-version"])]);return{codexPluginListOutput:Y,hooks:zt(P,process.cwd(),{ampPluginListOutput:H,codexPluginListOutput:Y,copilotCliVersion:Z})}}async function ob(P,L,H=Ft){let Y=await Pu(P,H);return Y.hooks.filter((Z)=>L==="install"?Z.configured:Z.detected&&Z.method!==eo||Z.inspectionStatus==="not-inspected").filter((Z)=>!Eu(Z)).filter((Z)=>Z.platform!=="codex"||!As(Y.codexPluginListOutput)||ku(Y.codexPluginListOutput)).map((Z)=>Z.platform)}function ib(P,L,H,Y){if(H.length>0)return{finish:async()=>[hu(H,L)]};if(!Y.selectTargets&&!ys(Y.input,Y.output))return{finish:async()=>[hu(H,L)]};let Z=Y.detectConfiguredTargets??(()=>ob(P,L,Y.fetchVersion)),oe=Promise.all([Bd(Y.probeTargets).then((se)=>eu(se,P)),Z()]);return{ready:oe,finish:async()=>{let[se,me]=await oe,he=Gd(se,{action:L,configuredTargets:me}),ke=Y.selectTargets?await Y.selectTargets(L,bu(L,he)):await Pd(L,bu(L,he),{input:Y.input,output:Y.output});if(ke==="update")return ke;if(!ke||ke.length===0)return null;return Cs(ke)}}}async function sb(P,L,H=!1,Y){let Z=Cu[P];Z.beforeInstall?.(L);let oe=typeof Z.installCommands==="function"?await Z.installCommands(L,Y):{commands:Z.installCommands};return await pi(oe.commands),await Il(oe.cleanupCommands??[]),await oe.afterInstall?.(),[`${oe.update||H?"Updated":"Installed"} ${cn(P)} integration`,oe.message??Z.postInstallMessage].filter(Boolean).join(`
`)}async function ab(P,L){let H=Cu[P];if(!H.uninstallCommands)throw Error(`${cn(P)} uninstall is not supported`);let Y=typeof H.uninstallCommands==="function"?H.uninstallCommands(L):{commands:H.uninstallCommands};return await pi(Y.commands),Y.afterUninstall?.(),`Uninstalled ${cn(P)} integration`}function lb(P){let L=zc(P);return L.alreadyInstalled?`Uninstalled OpenCode plugin from ${L.path}`:`OpenCode plugin not installed in ${L.path}`}var Su={"antigravity-cli":{install:Hd,uninstall:Md},cursor:{install:jl,uninstall:Fl},devin:{install:Jl,uninstall:zl},droid:{install:nc,uninstall:tc},"grok-build":{install:dc,uninstall:uc},"kimi-code":{install:fu,uninstall:mu}};function cb(P,L,H,Y=!1){if(P==="install"&&!Y)xo(H);let Z=Su[L][P](H),oe=cn(L),se=P!=="install"?"Uninstalled":Y?"Updated":"Installed";return P==="install"&&Z.alreadyInstalled?Y?`${oe} hook up to date in ${Z.path}`:`${oe} hook already installed in ${Z.path}`:P==="uninstall"&&!Z.alreadyInstalled?`${oe} hook not installed in ${Z.path}`:`${se} ${oe} hook ${P==="install"?"in":"from"} ${Z.path}`}var Ru={amp:{install:$d,uninstall:Dd,restartNote:'Amp personal plugins apply to every Amp session, including Orb threads. Restart Amp or run "plugins: reload" to apply the change.'},"hermes-agent":{install:vc,uninstall:bc,afterInstall:async(P)=>{let L=Bi(P);return await fn(["hermes","plugins","enable",Sn,"--no-allow-tool-override"]),!L},beforeUninstall:async(P)=>{Ui(P);try{await fn(["hermes","plugins","disable",Sn])}catch(L){console.warn(`${L instanceof Error?L.message:String(L)}
Removing the plugin files anyway; ${Sn} may still be listed in the Hermes config.`)}},restartNote:"Restart Hermes to apply the change."}};async function db(P,L,H,Y=!1){let Z=Ru[L];if(P==="uninstall")await Z.beforeUninstall?.(H);let oe=P==="install"?await Z.install(H):await Z.uninstall(H),se=P==="install"&&await Z.afterInstall?.(H),me=cn(L),he=!se&&(P==="install"&&oe.alreadyInstalled||P==="uninstall"&&!oe.alreadyInstalled);return[he?P==="install"?`${me} plugin ${Y?"up to date":"already installed"} at ${oe.path}`:`${me} plugin not installed at ${oe.path}`:`${P!=="install"?"Uninstalled":Y?"Updated":"Installed"} ${me} plugin ${P==="install"?"at":"from"} ${oe.path}`,he?void 0:Z.restartNote].filter(Boolean).join(`
`)}var ub={"copilot-cli":{afterInstall:tb},cursor:{afterUninstall:$l},"hermes-agent":{beforeInstall:(P,L)=>{if(!L)xo(P)}},openclaw:{beforeUninstall:Ji},pi:{afterInstall:rb}};function pb(P){return P in Su}function fb(P){return P in Ru}var vu=["Install CC Safety Net as a native Kimi Code plugin:","","  1. Start Kimi Code and run: /plugins install https://github.com/kenryu42/cc-safety-net/tree/plugin","     Confirm the trust prompt; it defaults to cancel.","  2. Run /reload, or start a new session.","","Note: Kimi Code hooks are fail-open. When the hook process cannot start, crashes, or times","out, Kimi Code allows the tool call."].join(`
`);function Eu(P){return P.platform==="kimi-code"&&P.method===uo}function Tu(P){return po({environment:P,cwd:process.cwd()}).method==="hook config"}function mb(P){if(!Tu(P))return vu;return[vu,"",en.red(["CAUTION: the global Kimi Code hook is installed and will run alongside the plugin.","After the plugin is active, remove it with: cc-safety-net uninstall --kimi-code"].join(`
`))].join(`
`)}function bu(P,L){return L.map((H)=>P==="install"&&H.target==="kimi-code"&&H.unavailableReason==="already installed"?{...H,available:!0,unavailableReason:void 0,label:`${H.label} (global hook installed)`}:H)}function gb(P,L){if(P.selectKimiInstallMethod)return P.selectKimiInstallMethod();if(!ys(P.input,P.output))return Promise.resolve("global-hook");return xd({input:P.input,output:P.output,globalHookInstalled:Tu(L)})}async function Au(P,L,H,Y=!1,Z){let oe=ub[L];if(P==="install")oe?.beforeInstall?.(H,Y);if(P==="uninstall")oe?.beforeUninstall?.(H);if(pb(L))return[cb(P,L,H,Y),P==="uninstall"?await oe?.afterUninstall?.(H):void 0].filter(Boolean).join(`
`);if(fb(L))return db(P,L,H,Y);if(P==="uninstall")return L==="opencode"?lb(H):ab(L,H);return[await sb(L,H,Y,Z),await oe?.afterInstall?.(H)].filter(Boolean).join(`
`)}function yb(P){let L=mn({label:"update"},P).errors[0];if(L)throw Error(L)}async function hb(P,L=Ft){let H=await Pu(P,L),Y=Po(sr(P),"installed-plugins");return{targets:Cs([...H.hooks.filter((oe)=>oe.platform!=="copilot-cli"&&oe.detected&&oe.method!==eo&&oe.method!==vi).map((oe)=>oe.platform),...[Jr,bl,vl].flatMap((oe)=>So(Po(Y,...oe))?["copilot-cli"]:[]),...Kr(P,Ts)?["claude-code"]:[],...As(H.codexPluginListOutput)?["codex"]:[]]),codexPluginListOutput:H.codexPluginListOutput,kimiPlugin:H.hooks.some(Eu)}}async function vb(P){let L=c(),H=P.output??process.stdout,Y=(P.scriptPath??process.argv[1]??"").split(/[\\/]/),Z=Y.find((Ae)=>/^bunx-\d+-/.test(Ae)),oe=Z!==void 0||Y.includes("_npx")?null:(P.checkLatestVersion??Bn)(),se=async()=>{let Ae=oe&&await oe;if(Ae?.updateAvailable)H.write(`
Update available: cc-safety-net ${Ae.currentVersion} → ${Ae.latestVersion}. Update this CLI with your package manager, e.g. \`npm i -g cc-safety-net@latest\` for a global install.
`)},me=hb(L,P.fetchVersion??Ft).then(async(Ae)=>{let Le=new Set(Ae.targets);return{targets:Ae.targets,codexPluginListOutput:Ae.codexPluginListOutput,kimiPlugin:Ae.kimiPlugin,available:new Map(await Promise.all(On.filter((We)=>Le.has(We.target)&&gu.has(We.target)).map(async(We)=>[We.target,await vr(We.probeCommand)])))}}),he=await tr(P.showBanner??!0,()=>({ready:me,finish:()=>me}),()=>nr({input:P.input??process.stdin,output:H}),{loadingMessage:"Checking installed integrations…",output:H}),ke=await Promise.resolve().then(()=>(nu(L.tmpdir,process.platform,Z),null)).catch((Ae)=>wr(Ae));if(he.targets.length===0){if(H.write("No installed integrations found. Run `cc-safety-net install` to set one up.\n"),ke!==null)console.error(ke);return await se(),ke===null?0:1}let Pe=he.targets.some((Ae)=>yu.has(Ae))?await Promise.resolve().then(()=>(xo(L),null)).catch((Ae)=>wr(Ae)):null,Te=await Fr(Promise.all(he.targets.map((Ae)=>{if(Ae==="kimi-code"&&he.kimiPlugin)return Promise.resolve({message:"Kimi Code plugin skipped: update it in Kimi Code from /plugins (Installed tab, select cc-safety-net, press Enter)",failed:!1});if(gu.has(Ae)&&!he.available.get(Ae))return Promise.resolve({message:`${cn(Ae)} not found; skipped`,failed:!1});if(Pe!==null&&yu.has(Ae))return Promise.resolve({message:Pe,failed:!0});return Au("install",Ae,L,!0,he.codexPluginListOutput).then((Le)=>({message:Le,failed:!1}),(Le)=>({message:wr(Le),failed:!0}))})),{loadingMessage:`Updating ${he.targets.length} integration${he.targets.length===1?"":"s"}…`,output:H}),_e=ke===null?Te:[...Te,{message:ke,failed:!0}];return _e.forEach((Ae)=>Ae.failed?console.error(Ae.message):H.write(`${Ae.message}
`)),await se(),_e.some((Ae)=>Ae.failed)?1:0}function _s(P,L={}){return Promise.resolve().then(()=>yb(P)).then(()=>vb(L)).catch((H)=>(console.error(wr(H)),1))}async function kr(P,L,H={}){try{let Y=c(),Z=await tr(!0,()=>ib(Y,P,L,H),()=>nr({input:H.input??process.stdin,output:H.output??process.stdout}),{loadingMessage:P==="install"?"Checking available integrations…":"Checking installed integrations…",output:H.output??process.stdout});if(!Z)return(H.output??process.stdout).write(`Cancelled: nothing was ${P}ed.
`),0;if(Z==="update")return(H.runUpdate??(()=>_s([],{fetchVersion:H.fetchVersion,input:H.input,output:H.output,showBanner:!1})))();let oe=H.output??process.stdout;return await Ud(Z,async(se)=>{if(se==="kimi-code"&&P==="install"){let he=await gb(H,Y);if(he===null){oe.write(`Cancelled: Kimi Code integration was not installed.
`);return}if(he==="plugin"){oe.write(`${mb(Y)}
`);return}}let me=await Fr(Au(P,se,Y),{loadingMessage:`${P==="install"?"Installing":"Uninstalling"} ${cn(se)} integration…`,output:oe});oe.write(`${me}
`)}),0}catch(Y){return console.error(wr(Y)),1}}function wr(P){let L=P instanceof Error?P.message:String(P),H=typeof P==="object"&&P!==null&&"code"in P?P.code:null;if(H==="EACCES"||H==="EPERM")return`${L}
Check file permissions for the target config file and parent directory.`;if(H==="ENOENT")return`${L}
Check that the target config path and parent directory exist.`;if(H==="ENOTDIR")return`${L}
Check that every parent path component is a directory.`;return L}import{mkdirSync as Pb}from"node:fs";import{dirname as Sb}from"node:path";import{createInterface as Rb}from"node:readline";import{existsSync as Iu,readFileSync as bb}from"node:fs";function Ot(P,L){let H=ft(P,L);return{policy:H.policy,errors:de(ut(H.issues,pt,(Y)=>Y.kind==="custom")," "," ")}}function Cr(P,L){return Ot(P,L).errors}function _u(P,L){return{"safety.level":P.safety.level,...Is("safety.overrides",P.safety.overrides),"workflow.worktree_mode":String(P.workflow.worktree_mode),"destructive_command_protection.enabled":String(P.destructive_command_protection.enabled),...Is("destructive_command_protection.overrides",P.destructive_command_protection.overrides),"destructive_command_protection.allow_paths":Os(P.destructive_command_protection.allow_paths),"secret_protection.enabled":String(P.secret_protection.enabled),...Is("secret_protection.overrides",P.secret_protection.overrides),"secret_protection.deny_paths":Os(P.secret_protection.deny_paths),"secret_protection.allow_paths":Os(P.secret_protection.allow_paths),...L?{"audit.retention_days":String(P.audit.retention_days)}:{}}}function Ro(P,L,H){let Y=_u(P,H),Z=_u(L,H);return[...new Set([...Object.keys(Y),...Object.keys(Z)])].flatMap((oe)=>Y[oe]===Z[oe]?[]:[{field:oe,before:Y[oe],after:Z[oe]}])}function xr(P,L){let H=u(P,L);if(!Iu(H))return{baseline:k(globalThis.__CC_SAFETY_NET_EMBEDDED_POLICY__,P.home),diagnostics:[]};let Y=$t(H),Z=Ot(Y.value,P.home);return{baseline:Z.policy,diagnostics:Y.errors.length>0?Y.errors:Z.errors}}function $t(P){if(!Iu(P))return{errors:[`${P}: file not found`]};try{return{value:JSON.parse(bb(P,"utf-8")),errors:[]}}catch(L){let H=L instanceof Error?L.message:String(L);return{errors:[`${P}: ${L instanceof SyntaxError?`Invalid JSON: ${H}`:H}`]}}}function Eo(P,L){let H=wb(P)?P:{};return{version:L.version,...Object.fromEntries(["safety","workflow","destructive_command_protection","secret_protection"].filter((Y)=>H[Y]!==void 0).map((Y)=>[Y,H[Y]]))}}function Is(P,L){return Object.fromEntries(Object.entries(L).flatMap(([H,Y])=>Y===void 0?[]:[[`${P}.${H}`,String(Y)]]))}function Os(P){return P.length===0?"(none)":P.join(", ")}function wb(P){return!!P&&typeof P==="object"&&!Array.isArray(P)}import{chmodSync as kb,existsSync as Ou,mkdirSync as Cb,readFileSync as $u}from"node:fs";import{dirname as xb}from"node:path";function Du(P,L={}){let H=u(P,L);if(!Ou(H))return{path:H,exists:!1,raw:"",policy:I(),errors:[]};let Y=$u(H,"utf-8");if(!Y.trim())return{path:H,exists:!0,raw:Y,policy:I(),errors:["Config file is empty"]};try{let Z=Ot(JSON.parse(Y),P.home);return{path:H,exists:!0,raw:Y,policy:Z.policy,errors:Z.errors}}catch(Z){return{path:H,exists:!0,raw:Y,policy:I(),errors:[`Invalid JSON: ${Z instanceof Error?Z.message:String(Z)}`]}}}function Hn(P,L,H={}){let Y=u(P,H),Z=Ot(L,P.home);if(Z.errors.length>0)return{path:Y,policy:I(),errors:Z.errors};let oe=Z.policy;return Cb(xb(Y),{recursive:!0,mode:448}),h(ae(Y),`${JSON.stringify(oe,null,2)}
`,384),kb(Y,384),{path:Y,policy:oe,errors:[]}}function Nu(P,L){let H=Ot(L,P.home);if(H.errors.length>0)return{errors:H.errors};return{preview:Be(H.policy,P.env),errors:[]}}function Lu(P,L={}){let H=u(P,L);if(!Ou(H))return Hn(P,ne,L);let Y=$u(H,"utf-8");if(!Y.trim())return Hn(P,ne,L);try{return Hn(P,k(JSON.parse(Y),P.home),L)}catch{return Hn(P,ne,L)}}var ju=new Set(["check","apply"]),Fu="(unset)";async function Mu(P,L,H={}){let Y=mn({label:"policy",booleans:{global:["-g","--global"]},positionals:"list"},L),Z=Y.positionals[0],oe=[...Y.errors,...Z&&!ju.has(Z)?[`Unknown policy subcommand: ${Z}`]:[],...Z&&ju.has(Z)&&!Y.positionals[1]?[`policy ${Z} requires a file`]:[],...Y.positionals.slice(2).map((We)=>`Unexpected policy argument: ${We}`)];if(oe.length>0){for(let We of oe)console.error(We);return 1}let se=Y.positionals[1];if(!Z||!se)return Wt(Tr,console.error),1;let me=H.cwd??process.cwd(),he=Y.flags.global?u(P):y(me);if(!Y.flags.global&&O(P,{cwd:me}))return console.error(`${he} is the user policy, not a project policy; use --global for the user scope, or run from a project directory`),1;let ke=$t(se),Pe=[...ke.errors,...Cr(ke.value,P.home).map((We)=>`${se}: ${We}`),...!Y.flags.global&&Ab(ke.value)&&ke.value.audit!==void 0?[`${se}: audit settings are user scope only; remove the audit section from a project proposal`]:[]];if(Pe.length>0){for(let We of Pe)console.error(We);return 1}let Te=k(ke.value,P.home);if(console.log(`Scope: ${Y.flags.global?"user":"project"} (${he})`),console.log(`Proposal: ${se}`),Y.flags.global)Hu(k($t(he).value,P.home),Te,!0);if(!Y.flags.global){let We=xr(P).baseline;console.log("Effective policy (user + project merged):"),Hu(te(We,fe($t(he).value,P.home).policy).policy,te(We,fe(ke.value,P.home).policy).policy,!1)}if(Z==="check")return 0;let _e=H.input??process.stdin,Ae=H.output??process.stdout;if(!_e.isTTY||!Ae.isTTY)return console.error("policy apply confirms interactively; run this yourself in a terminal:"),console.error(`  cc-safety-net policy apply ${se}${Y.flags.global?" --global":""}`),1;if(!await Eb(`Apply this policy to ${he}? [y/N] `,_e,Ae))return console.log("Cancelled; nothing was written."),0;return Tb(P,he,ke.value,Te,Y.flags.global),console.log(`Policy applied: ${he}`),0}function Eb(P,L,H){let Y=Rb({input:L,output:H,terminal:!1});return new Promise((Z)=>{Y.once("close",()=>Z(!1)),Y.question(P,(oe)=>{Z(/^y(es)?$/i.test(oe.trim())),Y.close()})})}function Tb(P,L,H,Y,Z){if(Z){Hn(P,Y);return}Pb(Sb(L),{recursive:!0}),bn(L,Eo(H,Y))}function Hu(P,L,H){let Y=Ro(P,L,H);if(Y.length===0){console.log("No changes.");return}console.log(`Changes (${Y.length}):`);for(let Z of Y)console.log(`  ${Z.field}: ${Z.before??Fu} -> ${Z.after??Fu}`)}function Ab(P){return!!P&&typeof P==="object"&&!Array.isArray(P)}import{join as Gw}from"node:path";var Uu="# Custom Rules Reference\n\nAgent reference for generating CC Safety Net rulebook configuration.\n\n## Config Locations\n\n| Scope | Config path | Rulebook path | Priority |\n|-------|-------------|---------------|----------|\n| User | `~/.cc-safety-net/rules/rule.json` | `~/.cc-safety-net/rules/<rulebook-name>/rulebook.json` | First |\n| Project | `.cc-safety-net/rules/rule.json` | `.cc-safety-net/rules/<rulebook-name>/rulebook.json` | Second |\n| GitHub source | Listed in a local `rule.json` | Vendored into the consumer's `<rulebook-name>/rulebook.json` by `rule add` | Source order |\n\nEvery rulebook is a live file: the runtime reads it on each tool call, so an edit applies to the next command with no publishing step.\n\nUser scope is evaluated before project scope; within a scope, sources apply in `rules` array order. A duplicate active rulebook name keeps the first claim and ignores the later rulebook with a warning, so a user-scoped name shadows a project-scoped one.\n\nUse `cc-safety-net rule init` to create an inert local config. Use `--global` for user scope. Use `cc-safety-net rule init --example` to also create an inactive example rulebook. `CC_SAFETY_NET_HOME` overrides the `~/.cc-safety-net` user root.\n\nLegacy inline `.safety-net.json` and `~/.cc-safety-net/config.json` files are not loaded at runtime. Convert them with `cc-safety-net rule migrate`.\n\n## rule.json Schema\n\n```json\n{\n  \"version\": 1,\n  \"rules\": [\"project-rules\", \"owner/repo#main/team-rules\"],\n  \"overrides\": {\n    \"project-rules/block-docker-system-prune\": {\n      \"reason\": \"Use targeted Docker cleanup commands.\"\n    },\n    \"team-rules/block-npm-global\": \"off\"\n  },\n  \"transparent_wrappers\": [\"rtk\"]\n}\n```\n\n- `version`: Required. Must be `1`.\n- `$schema`: Optional. `cc-safety-net rule verify` inserts it into a valid `rule.json` that lacks it.\n- `rules`: Optional array of rulebook source strings. Missing `rules` is treated as `[]`.\n- `overrides`: Optional object keyed by `<rulebook-name>/<rule-name>`.\n- `overrides` values are either `\"off\"` to disable a rule or an object with a required `reason` (replacement block reason) and an optional `intent` (one of `hard_stop`, `use_alternative`, `scope_down`, `manual_only`, `stop_and_explain`).\n- A project override cannot target a user-scoped rule: only that override is ignored, the user rule keeps its configured state, and `rule verify` reports the diagnostic as a failure.\n- `transparent_wrappers`: Optional array of command names that transparently execute a visible child command.\n- `caffeinate`, `exec`, `nice`, `nohup`, `setsid`, `stdbuf`, `time`, and `timeout` are built-in transparent wrappers and need no configuration. Configure only other wrappers you intentionally trust, such as `\"rtk\"`.\n- Use `cc-safety-net rule wrapper add rtk` to configure RTK without manually editing `rule.json`.\n- `command_tools`: Optional array of shell tools that a plugin adds to an agent and that CC Safety Net does not know. Each entry is a tool name such as `\"ops_bash\"`, or `{ \"name\": \"ops_run_background\", \"cwd\": \"cwd\" }` when the tool takes its working directory in a named argument (otherwise `workdir`, `cwd`, or `working_directory` is read). A call to a declared tool with a non-empty string `command` is analyzed like a built-in shell command. User and project lists merge; the user entry wins a name declared in both.\n- Built-in shell and file tools are already analyzed and cannot be declared; `rule verify` reports one declared by hand.\n- Use `cc-safety-net rule tool add ops_bash ops_run_background` to declare tools in the user config, or add `--project` for the project config.\n\n## Rulebook Sources\n\n- Local sources are bare rulebook names such as `project-rules`; the rulebook file is `.cc-safety-net/rules/project-rules/rulebook.json`.\n- Run `cc-safety-net rule add owner/repo` to add every rulebook currently present on the repository's default branch.\n- Use `--only` to select one or more rulebooks while preserving their order: `cc-safety-net rule add owner/repo --only aws gcloud`.\n- Use `--ref` to select a branch, tag, or commit instead of the default branch: `cc-safety-net rule add owner/repo --ref v2 --only aws`.\n- GitHub sources are stored in canonical form as `owner/repo#ref/<rulebook-name>`. That form remains valid in `rule.json` and as direct CLI input.\n- GitHub refs may contain `/`-separated path segments, such as `feature/rulebook-v2`.\n- The GitHub source name, the repository directory name, and the rulebook `name` must match exactly.\n- Rulebook source strings must be unique in a config.\n\n## rulebook.json Schema\n\n```json\n{\n  \"rulebook_version\": 1,\n  \"name\": \"project-rules\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Project-specific CC Safety Net rules.\",\n  \"author\": \"project\",\n  \"allowed_commands\": [\"docker\"],\n  \"rules\": [\n    {\n      \"name\": \"block-docker-system-prune\",\n      \"command\": \"docker\",\n      \"subcommand\": \"system\",\n      \"block_args\": [\"prune\"],\n      \"reason\": \"Use targeted cleanup instead.\"\n    }\n  ],\n  \"tests\": [\n    {\n      \"command\": \"docker system prune\",\n      \"expect\": \"blocked\",\n      \"rule\": \"block-docker-system-prune\"\n    },\n    {\n      \"command\": \"docker ps\",\n      \"expect\": \"allowed\"\n    }\n  ]\n}\n```\n\n### Rulebook Fields\n\n| Field | Required | Constraints |\n|-------|----------|-------------|\n| `rulebook_version` | Yes | Must be `1` or `2` |\n| `name` | Yes | `^[a-zA-Z][a-zA-Z0-9_-]{0,63}$` |\n| `version` | Yes | Non-empty string |\n| `description` | No | Free text; not type-checked at runtime |\n| `author` | No | Free text; not type-checked at runtime |\n| `allowed_commands` | Yes | Unique command names matching `^[a-zA-Z][a-zA-Z0-9_-]*$` |\n| `rules` | Yes | Array of rule objects |\n| `tests` | No | Array of fixtures |\n\n### Rule Fields\n\n| Field | Required | Constraints |\n|-------|----------|-------------|\n| `name` | Yes | Unique within the rulebook (case-insensitive); same pattern as rulebook `name` |\n| `command` | Yes | Must be listed in `allowed_commands`; basename only, not path |\n| `subcommand` | No | Same pattern as `command`; omit to match any subcommand |\n| `intent` | No | One of `hard_stop`, `use_alternative`, `scope_down`, `manual_only`, `stop_and_explain` |\n| `block_args` | Yes | Non-empty array of non-empty strings |\n| `reason` | Yes | Non-empty string, max 256 chars |\n\n### Rule Fields (`rulebook_version` 2)\n\nVersion 2 replaces `subcommand` and `block_args` with an exact-token `match` object. Version 1 rulebooks keep their fields and their behavior; a client that does not support version 2 rejects the rulebook instead of applying broader version 1 semantics.\n\n```json\n{\n  \"name\": \"block-terraform-apply-destroy\",\n  \"command\": \"terraform\",\n  \"match\": {\n    \"command_path\": [\"apply\"],\n    \"any_args\": [\"-destroy\", \"--destroy\"]\n  },\n  \"reason\": \"Review a destroy plan first with 'terraform plan -destroy'.\",\n  \"intent\": \"use_alternative\"\n}\n```\n\n| Field | Required | Constraints |\n|-------|----------|-------------|\n| `name` | Yes | Same as version 1 |\n| `command` | Yes | Same as version 1 |\n| `match.command_path` | Yes | Non-empty array of non-empty command words |\n| `match.any_args` | No | Non-empty array of unique non-empty argument tokens |\n| `match.exclude_args` | No | Non-empty array of unique non-empty argument tokens |\n| `intent` | No | Same as version 1 |\n| `reason` | Yes | Same as version 1 |\n\n### Matching Behavior (`rulebook_version` 2)\n\n- **Command**: Normalized to lowercase basename, as in version 1.\n- **Command path**: After recognized global options and their values are skipped, the next command words must equal `command_path` exactly. AWS, gcloud, and Azure CLI value-taking global options are built in; Terraform's `-chdir=dir` is `=`-joined and is skipped with its own token.\n- **Unrecognized options**: A token starting with `-` that is not a recognized global option is skipped without consuming a value, so an unlisted value-taking option with a separate value (`--newflag value`) makes the rule miss. This fails open deliberately; document such gaps in the rulebook.\n- **`any_args`**: At least one listed token must appear literally among the arguments.\n- **`exclude_args`**: Any listed token appearing literally among the arguments prevents the match, which is how a safe preview such as `aws s3 rm --dryrun` stays allowed.\n- **No short-option expansion**: Arguments compare as exact tokens, so list every accepted spelling (`\"-destroy\"` and `\"--destroy\"`).\n- **Literal and case-sensitive**: No regex, glob, or substring matching. The first matching rule wins.\n- Release channels are separate rules: `gcloud beta compute instances delete` needs its own `command_path`.\n\n### Test Fixture Fields\n\n| Field | Required | Constraints |\n|-------|----------|-------------|\n| `command` | Yes | Non-empty shell command string |\n| `expect` | Yes | `\"blocked\"` or `\"allowed\"` |\n| `rule` | Required for blocked fixtures | Rule name expected to block the command |\n\nFixtures are optional documentation of intended behavior. Version 1 fixtures are shape-validated only. Version 2 fixtures are evaluated against the rulebook's own rules when a source is fetched by `rule add` or `rule update`, and by `rule verify`; a failing fixture rejects that source before it is written. Loading a rulebook does not re-evaluate fixtures. CC Safety Net never executes fixture commands; they are analyzer inputs only.\n\n## Matching Behavior\n\nThe subcommand, argument, and option rules below describe `rulebook_version` 1 rules; version 2 rules match as described in Matching Behavior (`rulebook_version` 2). Execution order and transparent wrappers apply to both.\n\n- **Command**: Normalized to lowercase basename with any trailing `.exe` removed (`/usr/bin/git` → `git`).\n- **Subcommand**: The first command token after recognized Git and Docker global options and their values; `--` ends option parsing. An unrecognized option without `=` may consume the following token as its value.\n- **Arguments**: Each `block_args` value is compared literally against every command token, including expanded short options. The command is blocked if **any** item matches.\n- **Short options**: Expanded (`-Ap` matches `-A`).\n- **Long options**: Exact match (`--all-files` does not match `--all`).\n- **Execution order**: Built-in rules first, then custom rulebooks. Custom rules only add restrictions.\n- **Transparent wrappers**: A configured wrapper such as `rtk` lets `rtk git commit` be analyzed as `git commit` only when `git` is protected by built-in analyzers or active custom rules. `rtk -- git commit` is also supported.\n\n## Workflow\n\n1. Run `cc-safety-net rule init` or create `rule.json` manually.\n2. Optionally run `cc-safety-net rule init --example` to create an inactive example rulebook.\n3. Use `cc-safety-net rule wrapper add rtk` for trusted transparent wrappers.\n4. Run `cc-safety-net rule add <source>` after creating or choosing a rulebook source; add `--only <rulebook...>` or `--ref <ref>` for repository selection. The command adds the selected sources and syncs them.\n5. Edit a local rulebook whenever you like: the edit is enforced on the next command, so there is nothing to run afterwards.\n6. Run `cc-safety-net rule update [source]` to re-fetch remote sources and rewrite the vendored copies; the command prints what changed. A source with an ordinary update failure keeps its vendored copy while the other selected sources still update. Resource-limit failures remain fatal for the whole update.\n7. Run `cc-safety-net rule verify` to validate config, local rulebooks, and shareable GitHub-source rulebook directories in the current repository (it does not fetch remote content).\n8. Run `cc-safety-net rule list` to inspect active rulebooks and transparent wrappers.\n\nA missing or invalid rulebook file makes that source inactive, and an unreadable or invalid `rule.json` makes every source in its scope inactive. Inactive sources stop applying their rules while other custom rules and all built-in protections stay active. Fix the file named in the diagnostic, or run `cc-safety-net rule update` when a remote source has not been vendored yet. Run `cc-safety-net status` to see degraded sources.\n";function To(P,L){if(!P.ok){Ju(P);return}qu(P,L)}function Gu(P,L,H){if(P.ok)console.log(H);if(!P.add){To(P,`Added rulebook source: ${L}`);return}if(!P.ok){Ju(P);return}if(P.add.added.length>0)console.log(`Added ${P.add.added.length} ${P.add.added.length===1?"rulebook":"rulebooks"} from ${P.add.source} at ${P.add.ref}:`),P.add.added.forEach((Y)=>{console.log(`  - ${Y}`)});if(P.add.alreadyConfigured.length>0)console.log(`Rulebooks already configured from ${P.add.source} at ${P.add.ref}: ${P.add.alreadyConfigured.join(", ")}`);if(P.add.commits.length>0)console.log(`Vendored at ${P.add.commits.map((Y)=>Y.slice(0,7)).join(", ")}.`);qu(P,"Rule config updated.")}function qu(P,L){for(let H of P.changes??[])console.log(H);console.log(L),console.log(""),_b(P.entries)}function _b(P){if(P.length===0){console.log("Active rulebooks: (none)");return}console.log(`Active rulebooks (${P.length}):`);for(let L of P)console.log(`  - ${L.name} ${L.version} (${Ib(L.ruleCount)})`),console.log(`    Source: ${L.spec}`)}function Ib(P){return`${P} ${P===1?"rule":"rules"}`}function Vu(P){zn("Active sources",P.rulebooks,(L)=>[`[${L.source}] ${L.name} ${L.version}`,`  Source: ${L.spec}`]),zn("Active rules",P.rules,(L)=>[`[${$b(P,L.name)}] ${L.name}`,...Ob(L),`  Reason: ${L.reason}`]),zn("Disabled rules",Bu(P,"off"),(L)=>[L.key]),zn("Reason overrides",Bu(P,"reason"),(L)=>[L.key,`  Reason: ${L.value.reason}`]),zn("Transparent wrappers",P.transparent_wrappers,(L)=>[L]),zn("Issues",P.errors,(L)=>[L]),zn("Warnings",P.warnings,(L)=>[L])}function Ku(P){zn("Command tools",P,(L)=>typeof L.tool==="string"?[`[${L.scope}] ${L.tool}`]:[`[${L.scope}] ${L.tool.name}`,...L.tool.cwd===void 0?[]:[`  Cwd argument: ${L.tool.cwd}`]])}function zn(P,L,H){if(L.length===0){console.log(`${P}: (none)`);return}console.log(`${P} (${L.length}):`);for(let Y of L){let[Z,...oe]=H(Y);console.log(`  - ${Z}`);for(let se of oe)console.log(`    ${se}`)}}function Ob(P){if(!P.match)return[`  Command: ${P.subcommand?`${P.command} ${P.subcommand}`:P.command}`,`  Block args: ${P.block_args.join(", ")}`];return[`  Command: ${[P.command,...P.match.command_path].join(" ")}`,...P.match.any_args?[`  Any args: ${P.match.any_args.join(", ")}`]:[],...P.match.exclude_args?[`  Exclude args: ${P.match.exclude_args.join(", ")}`]:[]]}function $b(P,L){return P.rulebooks.find((H)=>H.rules.includes(L))?.source??"project"}function Bu(P,L){return Object.entries({...P.userConfig?.overrides,...P.projectConfig?.overrides}).filter((H)=>{if(L==="off")return H[1]==="off";return!!H[1]&&typeof H[1]==="object"}).map(([H,Y])=>({key:H,value:Y}))}function Ju(P){for(let L of P.errors)console.error(L)}import{dirname as yp,join as Lo}from"node:path";import{join as Ls,resolve as Vb}from"node:path";function Pr(P){let L=d(P);if(L.errors.length>0)return{ok:!1,result:{ok:!1,errors:L.errors,entries:[]}};return{ok:!0,config:L.config??ue}}function zu(P){bn(P,ue)}function Wu(P){bn(P,{rulebook_version:1,name:"example-rules",version:"1.0.0",description:"Project-specific CC Safety Net rules.",author:"project",allowed_commands:["docker"],rules:[{name:"block-docker-system-prune",command:"docker",subcommand:"system",block_args:["prune"],reason:"Use targeted cleanup instead."}],tests:[{command:"docker system prune",expect:"blocked",rule:"block-docker-system-prune"}]})}import{dirname as Oo}from"node:path";var Db="custom.";function Ao(P){if(P.rulebook_version!==2)return[];let L=P.rules.map((H)=>({name:H.name,command:H.command,block_args:[],match:H.match,reason:H.reason,intent:H.intent}));return(P.tests??[]).flatMap((H,Y)=>{let Z=$s(v(H.command));if(Z.length===0)return[`tests[${Y}]: could not parse fixture command: ${H.command}`];let oe=Z.reduce((se,me)=>se??N(me,L)?.id.slice(Db.length),void 0);if(H.expect==="blocked"){if(oe===H.rule)return[];let se=oe?`"${oe}" matched first`:"no rule matched";return[`tests[${Y}]: expected "${H.rule}" to block "${H.command}" but ${se}`]}return oe?[`tests[${Y}]: expected "${H.command}" to be allowed but "${oe}" matched`]:[]})}function $s(P){return P.nodes.flatMap((L)=>{if(L.kind==="group"||L.kind==="function")return $s(L.body);if(L.kind!=="command")return[];let H=Ee(re(L.dialect,L.words)).words.map(t);return[...H.length>0?[H]:[],...L.nested.flatMap((Y)=>$s(Y))]})}var _o=Object.freeze({concurrency:4,maxRequests:131,maxResponseBytes:67108864});function Io(P={}){return{requests:0,responseBytes:0,maxRequests:P.maxRequests??_o.maxRequests,maxResponseBytes:P.maxResponseBytes??_o.maxResponseBytes}}function Mn(P){return{controller:new AbortController,budget:Io(),resolveUrl:P}}function Yu(P){return P instanceof Error&&P.message==="Rule synchronization exceeds CC Safety Net's safe resource limits."}function Zu(P){if(P.requests>=P.maxRequests)throw Error("Rule synchronization exceeds CC Safety Net's safe resource limits.");P.requests++}function Xu(P,L){if(L>P.maxResponseBytes-P.responseBytes)throw P.responseBytes+=L,Error("Rule synchronization exceeds CC Safety Net's safe resource limits.");P.responseBytes+=L}var np=Object.freeze({timeoutMs:15000,metadataBytes:524288,commitBytes:262144,treeBytes:16777216,rawBytes:4194304});async function Qu(P,L,H=w(Oo(Oo(L)),"rules policy"),Y=Mn()){if(C(P))return Fb(P,Y);return jb(P,L,H)}async function tp(P,L,H,Y,Z,oe){if(!C(P))return Qu(P,L,H,Y);let se=Z?null:Nb(P,L,H);if(se)return se;if(!Z&&!oe)throw Error(`${P} is not vendored; run rule update ${P} to vendor it`);return Qu(P,L,H,Y)}function Nb(P,L,H=w(Oo(Oo(L)),"rules policy")){let Y=M(P),Z=F(L,Y.name),oe=r(i(H,Z));if(oe===null)return null;let se=pe(Ds(oe,`Invalid rulebook ${Z}.`));if(se.name!==Y.name)throw Error(`rulebook name "${se.name}" in ${Z} must match "${Y.name}"`);return{spec:P,rulebook:se,content:oe}}async function rp(P,L={}){if(!X(P))throw Error(`Invalid GitHub repository source: ${P}`);let[H,Y]=P.split("/");if(!H||!Y)throw Error(`Invalid GitHub repository source: ${P}`);if(L.ref!==void 0&&!ce(L.ref))throw Error(`GitHub rulebook refs must use valid path segments: ${L.ref}`);let Z=L.operation??Mn(),oe=L.ref??await Lb(H,Y,P,Z),se=await ip(H,Y,oe,P,Z),me=await $o(`https://api.github.com/repos/${H}/${Y}/git/trees/${se}?recursive=1`,"tree",Z),he=me.response;if(!he.ok)throw Error(`Failed to inspect ${P}: GitHub tree returned ${he.status}`);let ke=JSON.parse(me.content);if(!Array.isArray(ke?.tree))throw Error(`Failed to inspect ${P}: unexpected GitHub tree response`);let Pe=ke.tree,Te=[...new Set(Pe.flatMap((_e)=>{if(!_e||typeof _e!=="object")return[];let Ae=_e;if(Ae.type!=="blob"||typeof Ae.path!=="string")return[];let Le=Ae.path.match(Et);return Le?.[1]?[Le[1]]:[]}))].sort();if(Te.length===0)throw Error(`No rulebooks found in ${P} under ${be}/`);return{source:P,owner:H,repo:Y,ref:oe,commit:se,names:Te}}async function Lb(P,L,H,Y){let Z=await $o(`https://api.github.com/repos/${P}/${L}`,"metadata",Y),oe=Z.response;if(!oe.ok)throw Error(`Failed to inspect ${H}: GitHub returned ${oe.status}`);let me=JSON.parse(Z.content)?.default_branch;if(typeof me!=="string"||me==="")throw Error(`Failed to inspect ${H}: missing default branch`);if(!ce(me))throw Error(`GitHub returned an invalid default branch: ${me}`);return me}function jb(P,L,H){kt(P);let Y=F(L,P),Z=r(i(H,Y));if(Z===null)throw Error(`Rulebook source not found: ${P}`);let oe=op(Ds(Z,"Invalid local rulebook source."));if(oe.name!==P)throw Error(`rulebook name "${oe.name}" must match local source "${P}"`);return{spec:P,rulebook:oe,content:Z}}async function Fb(P,L){let H=M(P),Y=await ip(H.owner,H.repo,H.ref,P,L),Z=await $o(`https://raw.githubusercontent.com/${H.owner}/${H.repo}/${Y}/${H.path}`,"raw",L),oe=Z.response;if(!oe.ok)throw Error(`Failed to fetch ${P}: GitHub raw returned ${oe.status}`);let se=Z.content,me=op(Ds(se,"Invalid GitHub rulebook response."));if(me.name!==H.name)throw Error(`rulebook name "${me.name}" must match GitHub source "${H.name}"`);return{spec:P,rulebook:me,content:se}}function op(P){let L=pe(P),H=Ao(L);if(H.length>0)throw Error(H.join("; "));return L}function Ds(P,L){try{return JSON.parse(P)}catch{throw Error(L)}}async function ip(P,L,H,Y,Z){let oe=await $o(`https://api.github.com/repos/${P}/${L}/commits/${encodeURIComponent(H)}`,"commit",Z),se=oe.response;if(!se.ok)throw Error(`Failed to resolve ${Y}: GitHub returned ${se.status}`);let me=JSON.parse(oe.content);if(typeof me?.sha!=="string"||me.sha==="")throw Error(`Failed to resolve commit for ${Y}`);return me.sha}async function Hb(P,L,H={}){if(H.signal?.aborted)throw H.signal.reason;let Y=H.budget??Io(),Z=new AbortController,oe=()=>Z.abort(H.signal?.reason);H.signal?.addEventListener("abort",oe,{once:!0});let se=!1,me=setTimeout(()=>{if(Z.signal.aborted)return;se=!0,Z.abort()},H.timeoutMs??np.timeoutMs);try{if(H.signal?.aborted)throw H.signal.reason;Zu(Y);let he=await fetch(P,{signal:Z.signal,redirect:"error"});if(!he.ok)return sp(he),{response:he,content:""};return{response:he,content:await Mb(he,L,Y,()=>Z.abort())}}catch(he){if(se)throw Error("GitHub request timed out",{cause:he});if(H.signal?.aborted)throw H.signal.reason;throw he}finally{clearTimeout(me),H.signal?.removeEventListener("abort",oe)}}function $o(P,L,H){return Hb(H.resolveUrl?.(P)??P,L,{budget:H.budget,signal:H.controller.signal})}async function Mb(P,L,H=Io(),Y){let Z=np[`${L}Bytes`],oe=Number(P.headers.get("content-length"));if(Number.isFinite(oe)&&oe>Z)throw sp(P),Error(`GitHub ${L} response exceeds ${Z} bytes`);if(!P.body)return"";let se=P.body.getReader(),me=[],he=0;while(!0){let ke=await se.read();if(ke.done)break;try{Xu(H,ke.value.byteLength)}catch(Pe){throw Y?.(),ep(se),Pe}if(he+=ke.value.byteLength,he>Z)throw Y?.(),ep(se),Error(`GitHub ${L} response exceeds ${Z} bytes`);me.push(Buffer.from(ke.value))}return Buffer.concat(me,he).toString("utf-8")}function sp(P){if(!P.body)return;ap(()=>P.body?.cancel())}function ep(P){ap(()=>P.cancel())}function ap(P){try{Promise.resolve(P()).catch(()=>{})}catch{}}var Ub=/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)#(.+)$/;function lp(P,L){let H=up(P.rules,L);if(H.length>0)return{ok:!0,specs:H};return dp(P.rules,L)}function cp(P,L){let H=up(P,L);if(H.length>0)return{ok:!0,specs:H};let Y=Gb(P,L);if(Y.length>0)return{ok:!0,specs:Y};let Z=qb(P,L);if(!Z.ok)return Z;if(Z.specs.length>0)return{ok:!0,specs:Z.specs};return dp(P,L)}function dp(P,L){let H=P.filter((Y)=>Ns(Y)?.name===L);if(H.length===1)return{ok:!0,specs:H};return Bb(L,H)}function Bb(P,L){return{ok:!1,result:{ok:!1,errors:L.length===0?[`No configured rulebook matches ${P}`]:[`Ambiguous rulebook match ${P}: ${L.join(", ")}`],entries:[]}}}function up(P,L){return P.filter((H)=>H===L)}function Gb(P,L){let H=L.match(Ub),Y=H?.[1],Z=H?.[2],oe=H?.[3];if(!Y||!Z||!oe||!ce(oe))return[];return pp(P,(se)=>se.owner===Y&&se.repo===Z&&se.ref===oe)}function qb(P,L){if(!X(L))return{ok:!0,specs:[]};let[H,Y]=L.split("/"),Z=pp(P,(se)=>se.owner===H&&se.repo===Y);if(new Set(Z.map((se)=>Ns(se)?.ref).filter((se)=>!!se)).size<2)return{ok:!0,specs:Z};return{ok:!1,result:{ok:!1,errors:[`Multiple refs are configured for ${L}. Use an explicit ref:`,`  cc-safety-net rule remove ${L}#<ref>`],entries:[]}}}function Ns(P){try{return M(P)}catch{return null}}function pp(P,L){return P.filter((H)=>{let Y=Ns(H);return Y?L(Y):!1})}async function No(P,L={}){return Kb(P,L,await Do(P,L,Mn()))}function Kb(P,L,H){if(!H.ok)return H;let Y=hn(P,L),Z=[...new Set(V(Y.configPath,Y.filesystemScope))];if(Z.length===0)return H;return{ok:!1,errors:Z,entries:H.entries}}async function Do(P,L,H,Y={},Z=new Set,oe=new Set){try{let se=hn(P,L),me=Pr(se.configTarget);if(!me.ok)return me.result;let he=me.config,ke=L.only?lp(he,L.only):{ok:!0,specs:he.rules};if(!ke.ok)return ke.result;let Pe=new Set([...L.refresh?ke.specs:[],...Z]),Te=(nn)=>tp(nn,se.configDir,se.filesystemScope,H,Pe.has(nn),!L.refresh||Pe.has(nn)),_e=await tw(he.rules,L.refresh?(nn)=>Te(nn).then((sn)=>({ok:!0,item:sn})).catch((sn)=>{if(Yu(sn))throw sn;return{ok:!1,spec:nn,message:sn instanceof Error?sn.message:String(sn)}}):async(nn)=>({ok:!0,item:await Te(nn)}),H),Ae=_e.filter((nn)=>!nn.ok),Le=_e.filter((nn)=>nn.ok).map((nn)=>nn.item),We=Le.flatMap((nn)=>Jb(nn,he.rules)),Fe=Le.flatMap((nn)=>zb(nn,oe,se)),Ze=new Set([...We,...Fe].map((nn)=>nn.spec)),tn=[...Ae,...We,...Fe],on=[],ln=Yb(on,()=>Le.flatMap((nn)=>Ze.has(nn.spec)||tn.length>0&&oe.has(nn.spec)?[]:Wb(nn,se,Y,on)));return{ok:tn.length===0,errors:tn.map((nn)=>`Failed to update ${nn.spec}: ${nn.message}`),entries:Le.map(Xb),changes:ln}}catch(se){return Rr(se)}}function Jb(P,L){if(!C(P.spec))return[];let H=Ge(P.spec),Y=L.filter((Z)=>Z!==P.spec&&Ge(Z).toLowerCase()===H.toLowerCase());if(Y.length===0)return[];return[{ok:!1,spec:P.spec,message:`rulebook name "${H}" is also claimed by ${Y.join(", ")}; rename one of them`}]}function zb(P,L,H){if(!L.has(P.spec)||!C(P.spec))return[];let Y=F(H.configDir,P.rulebook.name),Z=r(i(H.filesystemScope,Y));if(Z===null||Z===P.content)return[];return[{ok:!1,spec:P.spec,message:`${Y} already exists and no configured source claims it; remove or rename the file, then re-run rule add`}]}function Wb(P,L,H,Y){if(!C(P.spec))return[];let Z=F(L.configDir,P.rulebook.name),oe=i(L.filesystemScope,Z),se=r(oe);if(se===P.content)return[];return Y?.push({target:oe,previous:se}),h(oe,P.content,void 0,H._testAfterPolicyRename),Zb(P,se)}function Yb(P,L){try{return L()}catch(H){for(let Y of[...P].reverse()){if(Y.previous===null){W(Y.target);continue}h(Y.target,Y.previous)}throw H}}function Zb(P,L){if(L===null)return[`Vendored ${P.spec} (${P.rulebook.version})`];let H=Ce(L),Y="problem"in H?null:H.rulebook,Z=new Map(Y?.rules.map((se)=>[se.name,JSON.stringify(se)])??[]),oe=new Set(P.rulebook.rules.map((se)=>se.name));return[`Updated ${P.spec} (${Y?.version??"unreadable"} -> ${P.rulebook.version})`,...[...oe].filter((se)=>!Z.has(se)).map((se)=>`  + ${se}`),...[...Z.keys()].filter((se)=>!oe.has(se)).map((se)=>`  - ${se}`),...P.rulebook.rules.filter((se)=>{let me=Z.get(se.name);return me!==void 0&&me!==JSON.stringify(se)}).map((se)=>`  ~ ${se.name}`)]}function Xb(P){return{spec:P.spec,name:P.rulebook.name,version:P.rulebook.version,ruleCount:P.rulebook.rules.length}}async function fp(P,L,H={}){return Qb(P,L,H,Mn())}async function Qb(P,L,H,Y,Z={}){let oe=null,se=!1;try{let me=hn(P,H),he=r(me.configTarget);oe={target:me.configTarget,content:he};let ke=Pr(me.configTarget);if(!ke.ok)return ke.result;let Pe=ke.config,Te=X(L)?await rp(L,{ref:H.ref,operation:Y}):null,_e=Te?ew(Te,H.rulebooks):[],Ae=Te?_e.map((tn)=>nw(Pe.rules,Te,tn)??`${L}#${Te.ref}/${tn}`):[L],Le=Ae.filter((tn)=>!Pe.rules.includes(tn)),We=[...Pe.rules,...Le];if(We.length>xe)return rw();if(We.length!==Pe.rules.length)se=!0,bn(me.configTarget,{...Pe,rules:We},void 0,Z._testAfterPolicyRename);let Fe=await Do(P,H,Y,Z,new Set(Le),new Set(Le));if(!Fe.ok)Sr(me.configTarget,he);if(!Fe.ok||!Te)return Fe;let Ze=_e.filter((tn,on)=>Le.includes(Ae[on]??""));return{...Fe,add:{source:L,ref:Te.ref,selected:_e,added:Ze,alreadyConfigured:_e.filter((tn)=>!Ze.includes(tn)),commits:Le.length>0?[Te.commit]:[]}}}catch(me){if(se&&oe)try{Sr(oe.target,oe.content)}catch(he){return Rr(he)}return Rr(me)}}function ew(P,L){let H=L?[...new Set(L)]:P.names,Y=H.filter((Z)=>!P.names.includes(Z));if(Y.length>0)throw Error(`Rulebooks not found in ${P.source} at ${P.ref}: ${Y.join(", ")}
Available rulebooks: ${P.names.join(", ")}`);return H}function nw(P,L,H){let Y=`${L.source}#${L.ref}/${H}`;if(P.includes(Y))return Y;let Z=`${L.source}#${L.commit}/${H}`;return P.find((oe)=>oe===Z)}async function tw(P,L,H=Mn()){if(P.length>xe)throw Error(Se);let Y=[],Z=0,oe,se=Array.from({length:Math.min(P.length,_o.concurrency)},async()=>{while(!oe){let me=Z;if(me>=P.length)return;Z++;try{Y[me]=await L(P[me],me,H.controller.signal)}catch(he){if(!oe)oe={value:he},Z=P.length,H.controller.abort(he);return}}});if(await Promise.all(se),oe)throw oe.value;return Y}function rw(){return{ok:!1,errors:[Se],entries:[]}}async function mp(P,L,H={}){try{return await ow(P,L,H,{})}catch(Y){return Rr(Y)}}async function ow(P,L,H,Y){let Z=hn(P,H),oe=d(Z.configTarget);if(oe.errors.length>0)return{ok:!1,errors:oe.errors,entries:[]};if(!oe.config)return{ok:!1,errors:[`No config found at ${Z.configPath}`],entries:[]};let se=cp(oe.config.rules,L);if(!se.ok)return se.result;let me=H.deleteSource?iw(Z.configDir,se.specs,Z.filesystemScope):{ok:!0,dirs:[]};if(!me.ok)return me.result;let he=r(Z.configTarget);if(he===null)return Rr(Error("Rules config is unavailable."));try{bn(Z.configTarget,{...oe.config,rules:oe.config.rules.filter((Te)=>!se.specs.includes(Te))},void 0,Y._testAfterPolicyRename)}catch(Te){throw Sr(Z.configTarget,he),Te}let ke=await Do(P,H,Mn(),Y);if(!ke.ok)return Sr(Z.configTarget,he),ke;let Pe=sw(me.dirs,Y,Z.filesystemScope);if(!Pe.ok){Sr(Z.configTarget,he);let Te=await Do(P,H,Mn(),Y);if(!Te.ok)return{ok:!1,errors:[...Pe.result.errors,...Te.errors],entries:Te.entries};return Pe.result}return ke}function iw(P,L,H){let Y=L.flatMap((me)=>p.test(me)?[]:["--delete-source can only delete local rulebook sources"]),Z=L.map((me)=>Ls(P,me)),oe=Y.length>0?[]:Z.flatMap((me)=>gp(me,H)),se=[...Y,...oe];return se.length>0?{ok:!1,result:{ok:!1,errors:se,entries:[]}}:{ok:!0,dirs:Z}}function gp(P,L){let H=Vb(P),Y=i(L,H),Z=ye(Y);if(!Z)return[`Local rulebook source directory not found: ${P}`];let oe=Z.find((se)=>se.name==="rulebook.json");if(!oe)return[`Local rulebook source directory is missing rulebook.json: ${P}`];if(oe.kind!=="file")throw new o(L.label);if(r(i(L,Ls(H,"rulebook.json"))),Z.length>1)return[`Local rulebook source directory contains extra files: ${P}. delete manually if you really want to remove the directory.`];return[]}function sw(P,L,H){let Y=P.flatMap((Z)=>{try{if(!ye(i(H,Z)))return[];let oe=gp(Z,H);if(oe.length>0)return oe;return aw(Z,L,H),[]}catch(oe){return[`Failed to delete local rulebook source ${Z}: ${oe instanceof Error?oe.message:String(oe)}`]}});return Y.length>0?{ok:!1,result:{ok:!1,errors:Y,entries:[]}}:{ok:!0}}function aw(P,L,H){if(L._testDeleteLocalSourceDir){L._testDeleteLocalSourceDir(P);return}W(i(H,Ls(P,ve))),Ct(i(H,P))}function Sr(P,L){if(L===null){W(P);return}h(P,L)}function Rr(P){return{ok:!1,errors:[P instanceof Error?P.message:String(P)],entries:[]}}var lw=".safety-net.json",cw="~/.cc-safety-net/config.json";async function bp(P,L){let H=O(P,{cwd:L.cwd});if(H)console.log(`Skipped the project scope: ${A(L.cwd)} is the user rule config, not a project rule config`);return[H||await hp(P,{legacyPath:Lt(L.cwd),configPath:A(L.cwd),defaultRulebookName:"project-rules",migratedFrom:lw,cleanup:L.cleanup,syncOptions:{cwd:L.cwd}}),await hp(P,{legacyPath:jt(P),configPath:z(P),defaultRulebookName:"user-rules",migratedFrom:cw,cleanup:L.cleanup,syncOptions:{cwd:L.cwd,global:!0}})].every((Z)=>Z)?0:1}async function hp(P,L){let H=hn(P,L.syncOptions),Y=i(H.filesystemScope,L.legacyPath),Z=r(Y);if(Z===null)return console.log(`No legacy config found at ${L.legacyPath}`),!0;let oe=uw(Z);if(!oe.ok){for(let Ae of oe.errors)console.error(Ae);return!1}let se=d(H.configTarget);if(se.errors.length>0){for(let Ae of se.errors)console.error(Ae);return!1}let me=se.config??ue,he=pw(yp(L.configPath),me.rules,L.defaultRulebookName,L.migratedFrom,H.filesystemScope),ke=Lo(yp(L.configPath),he,"rulebook.json"),Pe=i(H.filesystemScope,ke),Te=[vp(H.configTarget),vp(Pe)],_e=await dw(P,L,H.configTarget,Pe,he,oe.config.rules,{...me,rules:me.rules.includes(he)?me.rules:[...me.rules,he]});if(!_e.ok){gw(Te);for(let Ae of _e.errors)console.error(Ae);return!1}if(!L.cleanup)return console.log(`Migrated legacy config at ${L.legacyPath}. Legacy file is no longer used.`),!0;if(!mw(H.configTarget,Pe,he,L.migratedFrom,oe.config.rules))return console.error(`Migration cleanup verification failed for ${L.legacyPath}`),!1;return W(Y),console.log(`Deleted legacy config at ${L.legacyPath}`),!0}async function dw(P,L,H,Y,Z,oe,se){try{return bn(H,se),bn(Y,fw(Z,L.migratedFrom,oe)),await No(P,L.syncOptions)}catch(me){return{ok:!1,errors:[me instanceof Error?me.message:String(me)]}}}function uw(P){try{let L=JSON.parse(P),H=Wo(L);if(H.errors.length>0)return{ok:!1,errors:H.errors};return{ok:!0,config:{version:1,rules:L.rules??[]}}}catch{return{ok:!1,errors:["Invalid JSON"]}}}function pw(P,L,H,Y,Z){let oe=L.find((se)=>yw(i(Z,Lo(P,se,"rulebook.json")))===Y);if(oe)return oe;if(r(i(Z,Lo(P,H,"rulebook.json")))===null)return H;for(let se=2;;se++){let me=`${H}-${se}`;if(r(i(Z,Lo(P,me,"rulebook.json")))===null)return me}}function fw(P,L,H){return{rulebook_version:1,name:P,version:"1.0.0",description:"Migrated CC Safety Net rules.",author:"project",migrated_from:L,allowed_commands:[...new Set(H.map((Y)=>Y.command))],rules:H,tests:H.map((Y)=>({command:[Y.command,Y.subcommand,Y.block_args[0]].filter(Boolean).join(" "),expect:"blocked",rule:Y.name}))}}function mw(P,L,H,Y,Z){if(!d(P).config?.rules.includes(H))return!1;try{let se=r(L);if(se===null)return!1;let me=JSON.parse(se);return me.migrated_from===Y&&JSON.stringify(me.rules)===JSON.stringify(Z)}catch{return!1}}function vp(P){return{target:P,content:r(P)}}function gw(P){for(let L of P){if(L.content===null){W(L.target);continue}h(L.target,L.content)}}function yw(P){let L=r(P);if(L===null)return null;try{let H=JSON.parse(L);return typeof H.migrated_from==="string"?H.migrated_from:null}catch{return null}}import{mkdir as hw,readFile as vw,writeFile as bw}from"node:fs/promises";import{dirname as ww,join as kw}from"node:path";var Cw=86400000,xw=604800000;async function kp(P,L=Date.now()){if(P.env.get("CC_SAFETY_NET_NO_UPDATE_CHECK"))return null;let H=tt(P);if(!H)return null;let Y=kw(H,".cc-safety-net","update-check.json"),Z=await Pw(Y,L);if(!Z.lastCheck||L-Z.lastCheck>Cw){let me=await Bn();if(Z.lastCheck=L,me.latestVersion)Z.latestVersion=me.latestVersion;if(!await wp(Y,Z))return null;if(me.error)return null}let oe=Z.latestVersion,se=pn();if(!oe||!ni(oe,se))return null;if(Z.notifiedVersion===oe&&Z.notifiedAt!==void 0&&L-Z.notifiedAt<xw)return null;if(Z.notifiedVersion=oe,Z.notifiedAt=L,!await wp(Y,Z))return null;return`UPDATE_AVAILABLE: cc-safety-net v${oe} is available (running v${se}). Ask the user once whether to run \`npx -y cc-safety-net@latest update\`; continue the current task either way and do not raise this again.`}async function Pw(P,L){let H=await vw(P,"utf8").then((oe)=>JSON.parse(oe)).catch(()=>{return});if(!H||typeof H!=="object"||Array.isArray(H))return{};let Y=H,Z=(oe)=>typeof oe==="number"&&Number.isFinite(oe)&&oe<=L?oe:void 0;return{lastCheck:Z(Y.lastCheck),latestVersion:typeof Y.latestVersion==="string"?Y.latestVersion:void 0,notifiedVersion:typeof Y.notifiedVersion==="string"?Y.notifiedVersion:void 0,notifiedAt:Z(Y.notifiedAt)}}async function wp(P,L){return hw(ww(P),{recursive:!0,mode:448}).then(()=>bw(P,JSON.stringify(L),{mode:384})).then(()=>!0).catch(()=>!1)}import{join as Aw,resolve as Hs}from"node:path";var Cp=new Map([["Bash","posix"],["PowerShell","powershell"],["Monitor","posix"]]);var xp=new Map([["Bash","auto"]]);var Pp=new Map([["bash","auto"],["Bash","auto"],["powershell","powershell"],["PowerShell","powershell"]]);var Sp=new Map([["Shell","auto"]]);var Rp=new Map([["exec","auto"]]),Ep="write_to_process";var Tp=new Map([["Execute","auto"]]);var Ap=new Map([["run_shell_command","auto"]]);var _p=new Map([["run_terminal_command","auto"],["run_terminal_cmd","auto"],["monitor","auto"],["bash","auto"],["Shell","auto"]]);var Ip=new Map([["terminal","posix"]]);var Op=new Map([["Bash","posix"]]);var $p="exec";var Ew=[["antigravity-cli",[...rl.keys(),ol]],["claude-code",[...Cp.keys()]],["codex",[...xp.keys()]],["copilot-cli",[...Pp.keys()]],["cursor",[...Sp.keys()]],["deepseek-harness",[...et.keys()]],["devin",[...Rp.keys(),Ep]],["droid",[...Tp.keys()]],["gemini-cli",[...Ap.keys()]],["grok-build",[..._p.keys()]],["hermes-agent",[...Ip.keys()]],["kimi-code",[...Op.keys()]],["openclaw",[$p]],["opencode",[Ye,Re]],["pi",[...Qe.keys()]]].flatMap(([P,L])=>L.map((H)=>({name:H,integration:cn(P)}))),Dp="and is already analyzed. Built-in tools cannot be declared.";function jo(P){let L=Ie(P),H=[...new Set(Ew.filter((Y)=>Ie(Y.name)===L).map((Y)=>Y.integration))].sort((Y,Z)=>Y.localeCompare(Z));if(H.length>0)return`"${P}" is a built-in shell tool of ${Tw(H)}, ${Dp}`;if(x(P)!=="unknown")return`"${P}" is a built-in file tool, ${Dp}`;return}function Tw(P){return P.length===1?P[0]??"":`${P.slice(0,-1).join(", ")} and ${P.at(-1)}`}var Lp="CC Safety Net Config",_w="═".repeat(Lp.length),Iw="https://raw.githubusercontent.com/kenryu42/cc-safety-net/main/assets/cc-safety-net.schema.json",Ow=new Set(["rule.json","rule.lock","cache"]);function jp(P,L={}){try{return $w(P,L)}catch(H){if(H instanceof o)return console.error(H.message),1;throw H}}function $w(P,L){let H=L.cwd??process.cwd(),Y=Q(P,{cwd:H}),Z=jt(P),oe=Lt(H),se=Hs(H,be),me=i(Y.userScope,Z),he=i(Y.projectScope,oe),ke=!1,Pe=!1,Te=[],_e=[],Ae=Dw(i(Y.projectScope,se));if(Lw(),r(Y.userConfigTarget)!==null){let Le=Un(Y.userConfigTarget);if(Le.errors.push(...V(Y.userConfigPath,Y.userScope),...Np(Y.userConfigTarget)),Te.push({scope:"User",path:Y.userConfigPath,result:Le,schema:"rules",target:Y.userConfigTarget}),Le.errors.length>0)ke=!0}if(r(me)!==null)if(Pe=!0,r(Y.userConfigTarget)!==null)_e.push(Fo("user","cleanup"));else{let Le=Yo(me);if(Te.push({scope:"User",path:Z,result:Le,schema:"legacy",inactive:!0,target:me}),_e.push(Fo("user",Le.errors.length>0?"fix-or-delete":"migrate")),Le.errors.length>0)ke=!0}if(r(Y.projectConfigTarget)!==null){let Le=Un(Y.projectConfigTarget);if(Le.errors.push(...V(Y.projectConfigPath,Y.projectScope),...Np(Y.projectConfigTarget)),Te.push({scope:"Project",path:Hs(Y.projectConfigPath),result:Le,schema:"rules",target:Y.projectConfigTarget}),Le.errors.length>0)ke=!0;if(r(he)!==null)Pe=!0,_e.push(Fo("project","cleanup"))}else if(r(he)!==null){Pe=!0,ke=!0;let Le=Yo(he);Te.push({scope:"Project",path:Hs(oe),result:Le,schema:"legacy",inactive:!0,target:he}),_e.push(Fo("project",Le.errors.length>0?"fix-or-delete":"migrate"))}if(Ae?.result.errors.length)ke=!0;if(Te.length===0&&!Ae)return console.log(`
No config files found. Using built-in rules only.`),0;for(let Le of Te)if(Le.inactive)Fw(Le.scope,Le.path,Le.result);else if(Le.result.errors.length>0)Hw(Le.scope,Le.path,Le.result.errors);else{if(Le.schema==="rules"&&Bw(Le.target))console.log(`
Added $schema to ${Le.scope.toLowerCase()} config.`);jw(Le.scope,Le.path,Le.result,Le.schema)}for(let Le of _e)console.error(`
${en.red(Le)}`);if(Ae)if(Ae.result.errors.length>0)Uw(Ae.path,Ae.result.errors);else Mw(Ae.path,Ae.result);if(ke)return console.error(`
Config validation failed.`),1;return console.log(Pe?`
Configs valid with warnings.`:`
All configs valid.`),0}function Np(P){return(d(P).config?.command_tools??[]).flatMap((L)=>jo(typeof L==="string"?L:L.name)??[])}function Fo(P,L){let H=`legacy ${P} config`;if(L==="cleanup")return`Warning: Legacy ${P} config is no longer needed. Run \`npx -y cc-safety-net rule migrate --cleanup\` to clean it up safely.`;if(L==="migrate")return`Warning: Legacy ${P} config is ignored by CC Safety Net. Run \`npx -y cc-safety-net rule migrate\`.`;return`Warning: Legacy ${P} config is no longer supported. Fix or delete the ${H}, then run \`npx -y cc-safety-net rule migrate\`.`}function Dw(P){if(ye(P)===null)return null;let L=Nw(P);if(L.ruleNames.size===0&&L.errors.length===0)return null;return{path:P.path,result:L}}function Nw(P){let L=[],H=new Set,Y=(ye(P)??[]).filter((Z)=>!Ow.has(Z.name)).sort((Z,oe)=>Z.name.localeCompare(oe.name));if(Y.length===0)return{errors:L,ruleNames:H};for(let Z of Y){if(!p.test(Z.name)){L.push(`rulebook directory names must match ${p}: ${Z.name}`);continue}if(Z.kind!=="directory"){L.push(`${Z.name} must be a rulebook directory`);continue}let oe=i(P.scope,Aw(P.path,Z.name,"rulebook.json")),se=r(oe);if(se===null){L.push(`${Z.name}/rulebook.json is required`);continue}try{let me;try{me=JSON.parse(se)}catch{L.push(`${Z.name}/rulebook.json: invalid JSON`);continue}let he=pe(me);if(he.name!==Z.name){L.push(`rulebook name "${he.name}" must match folder "${Z.name}"`);continue}let ke=Ao(he);if(ke.length>0){L.push(...ke.map((Pe)=>`${Z.name}/rulebook.json: ${Pe}`));continue}H.add(Z.name)}catch(me){L.push(me instanceof Error?`${Z.name}/rulebook.json: ${me.message}`:`${Z.name}/rulebook.json: ${String(me)}`)}}return{errors:L,ruleNames:H}}function Lw(){console.log(Lp),console.log(_w)}function jw(P,L,H,Y){if(console.log(`
✓ ${P} config: ${L}`),console.log(`  Schema: ${Y==="rules"?"rulebook sources":"legacy inline rules"}`),H.ruleNames.size>0){console.log(`  ${Y==="rules"?"Sources":"Rules"}:`);let Z=1;for(let oe of H.ruleNames)console.log(`    ${Z}. ${oe}`),Z++}else console.log(`  ${Y==="rules"?"Sources":"Rules"}: (none)`)}function Fw(P,L,H){if(console.error(`
✗ Legacy ${P.toLowerCase()} config: ${L}`),console.error("  Schema: legacy inline rules"),console.error("  Status: ignored by CC Safety Net"),H.errors.length>0){console.error("  Errors:");let Y=1;for(let Z of H.errors)for(let oe of Z.split("; "))console.error(`    ${Y}. ${oe}`),Y++;return}if(H.ruleNames.size>0){console.error("  Rules:");let Y=1;for(let Z of H.ruleNames)console.error(`    ${Y}. ${Z}`),Y++;return}console.error("  Rules: (none)")}function Hw(P,L,H){Fp(`${P} config`,L,H)}function Mw(P,L){console.log(`
✓ GitHub source rules: ${P}`),console.log("  Rulebooks:");let H=1;for(let Y of L.ruleNames)console.log(`    ${H}. ${Y}`),H++}function Uw(P,L){Fp("GitHub source rules",P,L)}function Fp(P,L,H){console.error(`
✗ ${P}: ${L}`),console.error("  Errors:");let Y=1;for(let Z of H)for(let oe of Z.split("; "))console.error(`    ${Y}. ${oe}`),Y++}function Bw(P){try{let L=r(P);if(L===null)return!1;let H=JSON.parse(L);if(H.$schema)return!1;return h(P,JSON.stringify({$schema:Iw,...H},null,2)),!0}catch(L){if(L instanceof o)throw L;return!1}}var Hp=new Set(["init","add","remove","update","sync","list","wrapper","tool","migrate","doc","verify"]),qw=new Set(["init","add","remove","update","sync","wrapper"]),Up=new Set(["add","remove","list"]),Vw="cc-safety-net/rulebooks";async function Bp(P,L){try{return await Kw(P,L)}catch(H){if(H instanceof o)return console.error(H.message),1;throw H}}async function Kw(P,L){let H=zw(L),Y=H.help?Jw(H.positionals):null;if(Y)return Wt(Y),0;if(H.errors.length>0){for(let ke of H.errors)console.error(ke);return 1}let Z=H.positionals[0];if(!Z)return Wt(Nt,console.error),1;let oe=H.positionals[1],se={global:H.global},me=process.cwd();if((Z==="tool"?H.project:!H.global&&qw.has(Z)&&!(Z==="wrapper"&&oe==="list"))&&O(P,{cwd:me}))return console.error(`${A(me)} is the user rule config, not a project rule config; ${Z==="tool"?"drop --project":"use --global"} for the user scope, or run from a project directory`),1;if(Z==="init"){let ke=hn(P,se);Zw(ke.configTarget);let Pe=Gw(ke.configDir,"example-rules","rulebook.json"),Te=i(ke.filesystemScope,Pe);if(H.example&&r(Te)===null)Wu(Te);let _e=V(ke.configPath,ke.filesystemScope);for(let Ae of _e)console.error(Ae);if(_e.length>0)return 1;return console.log("Rule config initialized."),0}if(Z==="add"){let ke=Gp(H);if(!ke)return console.error("rule add requires a source (pass --only <rulebook...> to select from cc-safety-net/rulebooks)"),1;let Pe=hn(P,se),Te=await fp(P,ke,{...se,ref:H.ref,rulebooks:H.only.length>0?H.only:void 0});return Gu(Te,ke,`Scope: ${H.global?"user":"project"} (${Pe.configDir})`),Te.ok?0:1}if(Z==="remove"){if(!oe)return console.error("rule remove requires a source"),1;let ke=await mp(P,oe,{...se,deleteSource:H.deleteSource});return To(ke,`Removed rulebook source: ${oe}`),ke.ok?0:1}if(Z==="update"){let ke=await No(P,{...se,only:oe,refresh:!0});return To(ke,"Rule config updated."),ke.ok?0:1}if(Z==="sync")return Wa(P,{global:H.global});if(Z==="list"){let ke=ee(P,{cwd:me});return Vu(ke),ke.errors.length>0?1:0}if(Z==="wrapper")return Xw(P,H);if(Z==="tool")return ek(P,H,me);if(Z==="migrate")return bp(P,{cleanup:H.cleanup,cwd:me});if(Z==="doc"){console.log(Uu);let ke=await kp(P);if(ke)console.error(ke);return 0}if(Z==="verify")return jp(P);return 1}function Jw(P){if(P.length===0)return Nt;let L=Nt.subcommands.filter((Y)=>Y.usage.split(" ")[0]===P[0]);if(L.length===0)return null;if(P.length===1&&L.length>1)return{name:`rule ${P[0]}`,description:`Subcommands of rule ${P[0]}`,usage:`rule ${P[0]} <subcommand>`,subcommands:L,options:[]};let H=P.length===1?L[0]:L.find((Y)=>Y.usage.split(" ")[1]===P[1]);if(!H)return null;return{name:`rule ${P[0]}`,description:H.description,usage:`rule ${H.usage}`,options:P[0]==="add"?Ko:[],examples:P[0]==="add"?Jo:void 0}}function zw(P){let L=mn({label:"rule",booleans:{global:["-g","--global"],project:["--project"],cleanup:["--cleanup"],deleteSource:["--delete-source"],example:["--example"]},values:{ref:["--ref"],cwdArg:["--cwd-arg"]},lists:{only:["--only"]},positionals:"list"},P),H={...L.flags,ref:L.values.ref,cwdArg:L.values.cwdArg,only:L.lists.only??[],help:L.help,positionals:L.positionals,errors:L.errors};return Ww(H),H}function Ww(P){let[L]=P.positionals;if(L&&!Hp.has(L))P.errors.push(`Unknown rule subcommand: ${L}`);if(P.deleteSource&&L!=="remove")if(L&&Hp.has(L))P.errors.push(`Unknown option for rule ${L}: --delete-source`);else P.errors.push("--delete-source is only valid with 'rule remove'");if(P.cleanup&&L!=="migrate")P.errors.push(Wn(L,"--cleanup"));if(P.example&&L!=="init")P.errors.push(Wn(L,"--example"));if(P.ref&&L!=="add")P.errors.push(Wn(L,"--ref"));if(P.only.length>0&&L!=="add")P.errors.push(Wn(L,"--only"));let H=L==="tool"?P.positionals[1]:void 0,Y=H&&Up.has(H)?`tool ${H}`:L;if(P.project&&H!=="add"&&H!=="remove")P.errors.push(Wn(Y,"--project"));if(P.cwdArg!==void 0&&H!=="add")P.errors.push(Wn(Y,"--cwd-arg"));if(L==="tool"&&P.global)P.errors.push(Wn(L,"--global"));if(L==="add")Yw(P);if(L==="migrate"){if(P.global)P.errors.push(Wn(L,"--global"));if(P.positionals.length>1)P.errors.push(`Unexpected rule migrate argument: ${P.positionals[1]}`)}else if(L==="wrapper")Mp(P,"a command");else if(L==="tool")Mp(P,"a tool name");else if(P.positionals.length>2)P.errors.push(`Unexpected rule argument: ${P.positionals[2]}`);if(L==="list"&&P.global)P.errors.push("Unknown option for rule list: --global")}function Gp(P){if(P.positionals[1])return P.positionals[1];if(P.ref||P.only.length>0)return Vw;return}function Yw(P){let L=Gp(P);if(!L)return;if((P.ref||P.only.length>0)&&!X(L)){if(P.ref)P.errors.push(`--ref can only select a ref for an owner/repo source: ${L}`);if(P.only.length>0)P.errors.push("--only can only select rulebooks from an owner/repo source");return}if(P.ref&&!ce(P.ref))P.errors.push(`--ref must use valid path segments: ${P.ref}`);let H=P.only.filter((Y)=>!p.test(Y));if(H.length>0)P.errors.push(`Invalid rulebook names: ${H.join(", ")}`)}function Wn(P,L){return P?`Unknown option for rule ${P}: ${L}`:`Unknown option for rule: ${L}`}function Mp(P,L){let H=P.positionals[0],Y=P.positionals[1],Z=P.positionals[2];if(!Y){P.errors.push(`rule ${H} requires add, remove, or list`);return}if(!Up.has(Y)){P.errors.push(`Unknown rule ${H} action: ${Y}`);return}if(Y==="list"){if(Z)P.errors.push(`Unexpected rule ${H} argument: ${Z}`);return}if(!Z){P.errors.push(`rule ${H} ${Y} requires ${L}`);return}if(H!=="tool"&&P.positionals.length>3)P.errors.push(`Unexpected rule ${H} argument: ${P.positionals[3]}`)}function Zw(P){if(r(P)===null){zu(P);return}let L=d(P);if(!L.config)return;bn(P,L.config)}async function Xw(P,L){let H=L.positionals[1],Y=L.positionals[2],Z=hn(P,{global:L.global}).configTarget;if(H==="list"){let he=d(Z);if(he.errors.length>0){for(let ke of he.errors)console.error(ke);return 1}return Qw(he.config?.transparent_wrappers??[]),0}if(!Y||!E.test(Y))return console.error("transparent wrapper must match command pattern"),1;if($e(Y))return console.error(`reserved command "${Y}" cannot be a wrapper`),1;let oe=d(Z);if(oe.errors.length>0){for(let he of oe.errors)console.error(he);return 1}let se=oe.config??ue,me=H==="add"?[...new Set([...se.transparent_wrappers??[],Y])]:(se.transparent_wrappers??[]).filter((he)=>he!==Y);return bn(Z,{...se,transparent_wrappers:me}),console.log(H==="add"?`Added transparent wrapper: ${Y}`:`Removed transparent wrapper: ${Y}`),0}function Qw(P){if(P.length===0){console.log("Transparent wrappers: (none)");return}console.log(`Transparent wrappers (${P.length}):`);for(let L of P)console.log(`  - ${L}`)}function ek(P,L,H){let Y=L.positionals[1],Z=[...new Set(L.positionals.slice(2))];if(Y==="list")return nk(P,H);let oe=[...Z.flatMap((ke)=>{if(!Ue.test(ke))return[`"${ke}" is not a tool name: ${we}.`];let Pe=Y==="add"?jo(ke):void 0;return Pe?[Pe]:[]}),...L.cwdArg!==void 0&&!Ue.test(L.cwdArg)?[`"${L.cwdArg}" is not an argument name: ${we}.`]:[]];if(oe.length>0){for(let ke of oe)console.error(en.red(`Error: ${ke}`));return 1}let se=hn(P,{global:!L.project}),me=Pr(se.configTarget);if(!me.ok){for(let ke of me.result.errors)console.error(ke);return 1}let he=Z.reduce((ke,Pe)=>{let Te=L.cwdArg===void 0?Pe:{name:Pe,cwd:L.cwdArg},_e=(Ae)=>(typeof Ae==="string"?Ae:Ae.name)===Pe;if(Y==="remove")return ke.filter((Ae)=>!_e(Ae));return ke.some(_e)?ke.map((Ae)=>_e(Ae)?Te:Ae):[...ke,Te]},me.config.command_tools??[]);bn(se.configTarget,{...me.config,command_tools:he});for(let ke of Z)console.log(Y==="add"?`Added command tool: ${ke}${L.cwdArg===void 0?"":` (cwd argument: ${L.cwdArg})`}`:`Removed command tool: ${ke}`);return console.log(`Scope: ${L.project?"project":"user"} (${se.configPath})`),0}function nk(P,L){let H=(O(P,{cwd:L})?["user"]:["user","project"]).map((Z)=>{let oe=hn(P,{global:Z==="user"});return{scope:Z,path:oe.configPath,...d(oe.configTarget)}}),Y=H.flatMap((Z)=>Z.errors.map((oe)=>`${Z.path}: ${oe}`));if(Y.length>0){for(let Z of Y)console.error(Z);return 1}return Ku(H.flatMap((Z)=>(Z.config?.command_tools??[]).map((oe)=>({scope:Z.scope,tool:oe})))),0}import{sep as ak}from"node:path";import{existsSync as tk,readFileSync as rk}from"node:fs";import{join as ok}from"node:path";async function ik(P){if(P.isTTY)return null;return(await st(P).catch(()=>null))?.trim()||null}function sk(P){let L=P.env.get("CLAUDE_SETTINGS_PATH");if(L)return L;return ok(Vr(P),"settings.json")}function Ms(P){let L=sk(P);if(!tk(L))return!1;try{let H=rk(L,"utf-8"),Y=JSON.parse(H);if(!Y.enabledPlugins)return!1;let Z="cc-safety-net@cc-marketplace";if(!(Z in Y.enabledPlugins))return!1;return Y.enabledPlugins[Z]===!0}catch(H){if(S(n.debug,P.env))console.error(`CC Safety Net debug: failed to read Claude settings: ${L}: ${H instanceof Error?H.message:String(H)}`);return!1}}async function Us(P,L=process.stdin){let H=Ms(P),Y;if(!H)Y="\uD83D\uDEE1️ CC Safety Net ❌";else{let oe=R(P,{cwd:process.cwd()}),se=oe.policy,me=_(se,P.env),he=Object.values(K(se,me.capabilities)).some((Te)=>Te.changesInherited),ke={standard:"✅",strict:"\uD83D\uDD12",paranoid:"\uD83D\uDC41️",custom:"\uD83D\uDD27"}[he?"custom":me.effectiveLevel],Pe=oe.policyScopes&&!oe.policyScopes.weakeningsIgnored&&oe.policyScopes.weakenings.length>0?"\uD83D\uDD3B":"";Y=`\uD83D\uDEE1️ CC Safety Net ${ke}${me.worktreeMode?"\uD83C\uDF33":""}${Pe}${oe.state==="degraded"?"⚠️":""}`}let Z=await ik(L);if(Z&&!Z.startsWith("{"))console.log(`${Z} | ${Y}`);else console.log(Y)}function qp(P){let L=R(P,{cwd:process.cwd()}),H=L.policy,Y=_(H,P.env),Z=!!process.env.NO_COLOR||!process.stdout.isTTY,oe=Math.min(process.stdout.columns||80,100),se=Z?"ok":"✔",me=Z?"OFF":"✘",he=(We,Fe)=>{let Ze=`  ${We.padEnd(13)}${Fe}`;return(Ze.length>oe?`${Ze.slice(0,oe-1)}…`:Ze).replaceAll(me,en.red(me))},ke=Object.values(K(H,Y.capabilities)).some((We)=>We.changesInherited),Pe=(We)=>We===P.home||We.startsWith(`${P.home}${ak}`)?`~${We.slice(P.home.length)}`:We,Te={ready:en.green,degraded:en.yellow}[L.state],_e=L.policyScopes?.weakenings??[],Ae=[...Ms(P)?[]:["plugin cc-safety-net@cc-marketplace is disabled in Claude Code; nothing is enforced in Claude Code until it is re-enabled. Other integrations are not affected."],...L.diagnostics],Le=Z?"-":"·";console.log([`${Z?"":"\uD83D\uDEE1️  "}CC Safety Net — ${Te(L.state)}`,"",he("Protection",`destructive ${H.destructiveCommandProtectionEnabled?se:me}   secrets ${H.secretProtection.enabled?se:me}`),he("Level",ke?`${Y.effectiveLevel} (customised)`:Y.effectiveLevel),he("Rules",H.rules.length===0?"none active":`${H.rules.length} active`),he("Policy",Pe(u(P))),...L.policyScopes?[he("Project",Pe(y(process.cwd())))]:[],...Y.worktreeMode?[he("Worktree","relaxations active")]:[],"",..._e.length===0?[]:[L.policyScopes?.weakeningsIgnored?"  Project policy (ignored)":"  Project policy",..._e.flatMap((We)=>mr(We,"      ",oe-6).map((Fe,Ze)=>Ze===0?`    ${Fe}`:Fe)),""],...Ae.length===0?["  Everything configured is active."]:["  Not active",...Ae.flatMap((We)=>mr(We,"      ",oe-6).map((Fe,Ze)=>Ze===0?`    ${Le} ${Fe}`:Fe)),"","  Full report: cc-safety-net doctor"]].join(`
`))}import{spawn as df}from"node:child_process";import{randomBytes as hk}from"node:crypto";import{existsSync as uf,mkdirSync as vk,readFileSync as bk}from"node:fs";import{createServer as wk}from"node:http";import{dirname as pf,join as kk}from"node:path";import{Writable as Ck}from"node:stream";var Ho=500;function lk(P){let L=P.filter((Z)=>Z.decision!=="allow"),H=P.filter((Z)=>Z.decision==="allow"),Y=Math.min(L.length,Math.max(Ho-H.length,Math.ceil(Ho/2)));return[...L.slice(0,Y),...H.slice(0,Ho-Y)]}function Vp(P,L,H=G(P)){if(H)J(P,H);let Y=(Fe)=>new Date(Fe.getFullYear(),Fe.getMonth(),Fe.getDate()).getTime(),Z=Y(new Date),oe=new Date(Z);oe.setDate(oe.getDate()-(L-1));let se=oe.getTime(),me=[],he={count:0};for(let Fe of H?Yn(H,he):[])for(let Ze of Dt(Fe,he)){let tn=new Date(Ze.ts).getTime();if(!Number.isFinite(tn))continue;if(tn>=se)me.push(Ze)}me.sort((Fe,Ze)=>new Date(Ze.ts).getTime()-new Date(Fe.ts).getTime());let ke=Array.from({length:L},()=>0),Pe=Array.from({length:L},()=>0),Te={},_e={},Ae={},Le=0,We=0;for(let Fe of me){let Ze=Fe.agent||"unknown";Te[Ze]=(Te[Ze]??0)+1;let tn=Math.round((Z-Y(new Date(Fe.ts)))/86400000),on=L-1-tn,ln=tn>=0&&tn<L;if(ln)Pe[on]=(Pe[on]??0)+1;if(Fe.decision!=="allow"){if(Le++,Fe.ruleId)_e[Fe.ruleId]=(_e[Fe.ruleId]??0)+1;let nn=Go(Fe.segment||Fe.command);if(nn)Ae[nn]=(Ae[nn]??0)+1;if(Fe.failureStage)We++;if(ln)ke[on]=(ke[on]??0)+1}}return{days:L,logsDir:H,homeDir:P.home,totalInWindow:me.length,truncated:me.length>Ho,unreadable:he.count,counts:{blocked:Le,allowed:me.length-Le,agents:Te,blockedByDay:ke,analyzedByDay:Pe,rules:_e,commands:Ae,errors:We},entries:lk(me).sort((Fe,Ze)=>new Date(Ze.ts).getTime()-new Date(Fe.ts).getTime())}}import{spawn as ck}from"node:child_process";import{existsSync as dk,statSync as Kp}from"node:fs";import{delimiter as uk,join as pk}from"node:path";var fk=120000,Mo="Choose the project folder",mk=`try
  return POSIX path of (choose folder with prompt "${Mo}")
on error number -128
  return ""
end try`,gk=`Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = '${Mo}'
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($dialog.SelectedPath) }`,Jp=[{binary:"zenity",args:["--file-selection","--directory",`--title=${Mo}`]},{binary:"kdialog",args:["--getexistingdirectory",".","--title",Mo]}],zp=(P,L)=>(L.PATH??"").split(uk).some((H)=>{if(H.length===0)return!1;try{let Y=Kp(pk(H,P));return Y.isFile()&&(Y.mode&73)!==0}catch{return!1}});function Bs(P,L){if(P==="darwin"||P==="win32")return!0;if(P!=="linux")return!1;if(!L.DISPLAY&&!L.WAYLAND_DISPLAY)return!1;return Jp.some((H)=>zp(H.binary,L))}function yk(P,L){if(P==="darwin")return{cmd:"osascript",args:["-e",mk]};if(P==="win32")return{cmd:"powershell.exe",args:["-NoProfile","-STA","-Command",gk]};let H=Jp.find((Y)=>zp(Y.binary,L));return H?{cmd:H.binary,args:H.args}:null}function Gs(P=process.platform,L=process.env){let H=yk(P,L);if(!H)return Promise.resolve({error:"No folder dialog is available on this system"});return new Promise((Y)=>{let Z=ck(H.cmd,H.args,{env:L,stdio:["ignore","pipe","pipe"]}),oe="",se=!1,me=(ke)=>{if(se)return;se=!0,clearTimeout(he),Y(ke)},he=setTimeout(()=>{Z.kill(),me({error:"The folder dialog timed out"})},fk);Z.stdout.on("data",(ke)=>{oe+=ke.toString()}),Z.on("error",()=>me({error:`Could not open the folder dialog (${H.cmd})`})),Z.on("close",()=>{let ke=oe.trim().replace(/\/+$/,"");if(!ke)return me({cancelled:!0});if(!dk(ke)||!Kp(ke).isDirectory())return me({error:"That selection is not a folder on disk"});me({path:ke})})})}var Wp=["en","ja","zh-CN"],Yp=["light","dark"],Uo=(P,L)=>P.includes(L),Zp=(P)=>typeof P==="object"&&P!==null&&!Array.isArray(P),Xp=(P)=>{let L=Zp(P)?P:{};return{...Uo(Wp,L.language)?{language:L.language}:{},...Uo(Yp,L.theme)?{theme:L.theme}:{}}},Qp=(P)=>{if(!Zp(P))return null;let L=Object.keys(P).every((Z)=>Z==="language"||Z==="theme"),H=P.language===void 0||Uo(Wp,P.language),Y=P.theme===void 0||Uo([...Yp,"auto"],P.theme);return L&&H&&Y?P:null},ef=(P,L)=>{let H=L.language??P.language,Y=L.theme==="auto"?void 0:L.theme??P.theme;return{...H?{language:H}:{},...Y?{theme:Y}:{}}};var nf=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CC Safety Net</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22512%22%20height%3D%22512%22%20viewBox%3D%220%200%20512%20512%22%3E%3Crect%20width%3D%22512%22%20height%3D%22512%22%20rx%3D%22112%22%20fill%3D%22%2317161b%22%2F%3E%3Csvg%20x%3D%2240%22%20y%3D%2240%22%20width%3D%22432%22%20height%3D%22432%22%20viewBox%3D%22-172.38%20-172.38%20824.77%20824.77%22%3E%3Cg%20transform%3D%22rotate(45%20240%20240)%22%3E%3Crect%20x%3D%22-30%22%20y%3D%2214%22%20width%3D%22195%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22315%22%20y%3D%2214%22%20width%3D%22195%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22-30%22%20y%3D%2294%22%20width%3D%22115%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22235%22%20y%3D%2294%22%20width%3D%22170%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22155%22%20y%3D%22174%22%20width%3D%22170%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%2275%22%20y%3D%22254%22%20width%3D%22170%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22395%22%20y%3D%22254%22%20width%3D%22115%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22-30%22%20y%3D%22334%22%20width%3D%22195%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22315%22%20y%3D%22334%22%20width%3D%22195%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22-30%22%20y%3D%22414%22%20width%3D%22115%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%22235%22%20y%3D%22414%22%20width%3D%22170%22%20height%3D%2252%22%20rx%3D%229%22%20fill%3D%22%23f5f4f0%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%22155%22%20width%3D%2252%22%20height%3D%22170%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%2294%22%20y%3D%2275%22%20width%3D%2252%22%20height%3D%22170%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%2294%22%20y%3D%22395%22%20width%3D%2252%22%20height%3D%22115%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%22174%22%20y%3D%22-30%22%20width%3D%2252%22%20height%3D%22195%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%22174%22%20y%3D%22315%22%20width%3D%2252%22%20height%3D%22195%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%22254%22%20y%3D%22-30%22%20width%3D%2252%22%20height%3D%22115%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%22254%22%20y%3D%22235%22%20width%3D%2252%22%20height%3D%22170%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%22334%22%20y%3D%22155%22%20width%3D%2252%22%20height%3D%22170%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%22414%22%20y%3D%2275%22%20width%3D%2252%22%20height%3D%22170%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3Crect%20x%3D%22414%22%20y%3D%22395%22%20width%3D%2252%22%20height%3D%22115%22%20rx%3D%229%22%20fill%3D%22%23e5602a%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E%3C%2Fsvg%3E%0A">
  <script id="ccsn-data" type="application/json"></script>
  <script>
// src/gui/frontend/gui-data.ts
var guiData = JSON.parse(document.getElementById("ccsn-data")?.textContent ?? "");

// src/gui/frontend/preferences.ts
var localeByLanguage = new Map([
  ["en", "en"],
  ["ja", "ja"],
  ["zh", "zh-CN"]
]);
var resolveLocale = (saved, languages) => saved ?? languages.map((tag) => localeByLanguage.get(tag.toLowerCase().split("-")[0] ?? "")).find((locale) => locale !== undefined) ?? "en";

// src/gui/frontend/head.ts
document.documentElement.lang = resolveLocale(guiData.preferences.language, navigator.languages);
if (guiData.preferences.theme)
  document.documentElement.style.colorScheme = guiData.preferences.theme;

  </script>
  <style>
:root {
  color-scheme: light dark;

  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --bg: light-dark(#f2f2f3, #0f0f10);
  --surface: light-dark(#ffffff, #19191b);
  --sidebar: light-dark(#fafafa, #121213);
  --field-bg: light-dark(#ffffff, #141414);
  --fill: light-dark(rgb(0 0 0 / 4%), rgb(255 255 255 / 6%));
  --hover: light-dark(rgb(0 0 0 / 4.5%), rgb(255 255 255 / 5%));
  --selected: light-dark(rgb(0 0 0 / 7%), rgb(255 255 255 / 9%));
  --pill-on: light-dark(#ffffff, #444448);
  --line: light-dark(rgb(0 0 0 / 8%), rgb(255 255 255 / 8%));
  --line-strong: light-dark(rgb(0 0 0 / 14%), rgb(255 255 255 / 13%));
  --ring: light-dark(rgb(0 0 0 / 10%), rgb(255 255 255 / 10%));

  --ink: light-dark(#18181b, #f0f0f0);
  --muted: light-dark(#5c5f66, #b3b3b3);
  --faint: light-dark(#7c8088, #8c8c8c);
  --on-ink: light-dark(#ffffff, #141414);

  --switch-off: light-dark(#c4c7cc, #4a4a4a);
  --switch-on: light-dark(#16a34a, #22c55e);
  --focus-ring: light-dark(#2563eb, #6ea2ff);
  --accent: light-dark(#16a34a, #22c55e);
  --danger: light-dark(#b91c1c, #dc2626);
  --danger-hover: light-dark(#991b1b, #b91c1c);
  --star: light-dark(#b7791f, #f2c94c);

  --ok-fg: light-dark(#15803d, #4ade80);
  --ok-bg: light-dark(#effaf3, rgb(74 222 128 / 10%));
  --ok-border: light-dark(#bfe6cc, rgb(74 222 128 / 25%));
  --err-fg: light-dark(#b42318, #ff8a80);
  --err-bg: light-dark(#fef3f2, rgb(255 138 128 / 10%));
  --err-border: light-dark(#f4cdc8, rgb(255 138 128 / 25%));
  --warn-fg: light-dark(#a14a06, #fbbf24);
  --warn-bg: light-dark(#fffaeb, rgb(251 191 36 / 10%));
  --warn-border: light-dark(#f3dfb0, rgb(251 191 36 / 25%));
  --info-fg: light-dark(#1d4ed8, #93c5fd);
  --info-bg: light-dark(#eff5ff, rgb(147 197 253 / 10%));
  --info-border: light-dark(#c8d9f7, rgb(147 197 253 / 25%));
  --paranoid-fg: light-dark(#7e22ce, #d8b4fe);
  --paranoid-bg: light-dark(#faf5ff, rgb(216 180 254 / 10%));
  --paranoid-border: light-dark(#e6d1f5, rgb(216 180 254 / 25%));

  --radius-sm: 6px;
  --radius: 8px;
  --radius-lg: 12px;
  --control-h: 32px;
  --row-x: 12px;
  --card-x: 16px;
  --shadow-float: 0 0 0 1px var(--line-strong), 0 8px 24px rgb(0 0 0 / 16%);

  font-family: var(--font-sans);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

[hidden] {
  display: none !important;
}

a {
  color: inherit;
}

p,
h1,
h2,
h3,
h4,
ul,
dl,
dd {
  margin: 0;
}

ul {
  padding: 0;
  list-style: none;
}

code,
.mono {
  font-family: var(--font-mono);
  font-size: 13px;
}

p code,
small code,
.empty code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--fill);
  font-size: 12.5px;
}

strong {
  font-weight: 600;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.muted {
  color: var(--muted);
}

.count {
  color: var(--faint);
  font-size: 13px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

:where(a, button, summary, [tabindex], input[type='checkbox'], input[type='radio']):focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

:where(input[type='search'], input[type='text'], input[type='number'], textarea, select):focus {
  border-color: var(--focus-ring);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 20%, transparent);
}

.app-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 18px 10px;
  border-right: 1px solid var(--line);
  background: var(--sidebar);
}

.brand {
  padding: 0 10px;
}

.brand-logo {
  display: flex;
  color: light-dark(#17161b, #f5f4f0);
}

.brand-home {
  display: flex;
}

.brand-logo svg {
  width: auto;
  height: 28px;
}

.sidenav {
  display: grid;
  gap: 1px;
}

.sidenav a {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-weight: 500;
  text-decoration: none;
}

.sidenav a:hover {
  background: var(--hover);
  color: var(--ink);
}

.sidenav a[aria-current='page'] {
  background: var(--selected);
  color: var(--ink);
}

.sidenav svg {
  width: 16px;
  height: 16px;
  flex: none;
}

.nav-dirty {
  margin-left: auto;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--warn-bg);
  color: var(--warn-fg);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}

.sidebar-foot {
  margin-top: auto;
  display: grid;
  gap: 4px;
  padding: 0 10px;
  font-size: 13px;
}

.sidebar-foot a,
.app-foot a {
  color: var(--faint);
  text-decoration: none;
}

.sidebar-foot a:hover,
.app-foot a:hover {
  color: var(--ink);
}

.language-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--faint);
}

.language-picker:hover,
.language-picker:focus-within {
  color: var(--ink);
}

.language-picker svg {
  width: 14px;
  height: 14px;
  flex: none;
}

.language-picker select {
  height: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: inherit;
}

.app-foot {
  display: none;
}

.content {
  min-width: 0;
}

main {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 36px 40px 72px;
  display: grid;
  gap: 28px;
}

.view {
  display: grid;
  gap: 28px;
  min-width: 0;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.page-head:has(> .icon-button) {
  flex-wrap: nowrap;
  align-items: flex-start;
}

.page-head h2 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 30px;
}

.page-head p {
  margin-top: 2px;
  color: var(--muted);
}

.section {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  min-height: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.section-sub {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card {
  min-width: 0;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--ring);
}

.card.pad {
  padding: var(--card-x);
}

.card.list {
  display: grid;
  padding: 4px;
}

.card.rows {
  padding: 0 var(--card-x);
}

.panel {
  display: grid;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 14px var(--card-x) 14px 20px;
  border-bottom: 1px solid var(--line);
}

.panel-head > div:first-child {
  flex: 1 1 0;
  min-width: 0;
}

.panel-list {
  display: grid;
  padding: 4px;
}

.panel-rows {
  padding: 0 var(--card-x) 0 20px;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  padding: 6px var(--row-x);
  border-radius: var(--radius);
  color: inherit;
  text-decoration: none;
}

a.list-row:hover,
button.list-row:hover:not(:disabled) {
  background: var(--hover);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 56px;
  padding: 12px 0;
}

.setting-row + .setting-row,
#safety-overrides + #workflow,
.path-list + .path-list {
  border-top: 1px solid var(--line);
}

#safety-overrides .setting-row:first-child {
  border-top: 0;
}

.setting-row.info {
  align-items: baseline;
  min-height: 48px;
}

.setting-text {
  display: grid;
  flex: 1;
  gap: 1px;
  min-width: 0;
}

label.setting-text {
  cursor: pointer;
}

.setting-text strong {
  font-weight: 500;
}

.setting-text small {
  color: var(--muted);
  font-size: 13px;
}

.setting-label {
  flex: none;
  width: 140px;
  color: var(--muted);
}

.setting-row.info code {
  flex: 1;
  min-width: 0;
}

.setting-row.info button {
  align-self: center;
}

.path-part {
  display: inline-block;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.icon-button {
  width: var(--control-h);
  padding: 0;
}

.icon-button svg {
  width: 16px;
  height: 16px;
}

.banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  padding: 12px 16px;
  border: 1px solid var(--err-border);
  border-radius: var(--radius);
  background: var(--err-bg);
  color: var(--err-fg);
}

.banner p {
  flex: 1 1 100%;
}

.banner a {
  font-weight: 600;
}

button,
.star-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--control-h);
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

button:hover:not(:disabled),
.star-cta:hover {
  background: var(--hover);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button svg {
  width: 15px;
  height: 15px;
  flex: none;
}

button.primary {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--on-ink);
}

button.primary:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--ink) 85%, var(--bg));
  background: color-mix(in srgb, var(--ink) 85%, var(--bg));
}

button.danger {
  border-color: var(--danger);
  background: var(--danger);
  color: #fff;
}

button.danger:hover:not(:disabled) {
  border-color: var(--danger-hover);
  background: var(--danger-hover);
}

button.danger-quiet {
  color: var(--err-fg);
}

button.danger-quiet:hover:not(:disabled) {
  border-color: var(--err-border);
  background: var(--err-bg);
}

button.quiet {
  border-color: transparent;
  color: var(--muted);
}

button.quiet:hover:not(:disabled) {
  color: var(--ink);
}

button.small {
  height: 26px;
  padding: 0 8px;
  font-size: 13px;
}

button.icon-only {
  width: 28px;
  height: 28px;
  padding: 0;
}

.link-button {
  flex: none;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.link-button::after {
  content: ' →';
}

.link-button:hover {
  color: var(--ink);
}

input[type='search'],
input[type='text'],
input[type='number'],
textarea,
select {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--field-bg);
  color: var(--ink);
  font: inherit;
}

input[type='search'],
input[type='text'],
input[type='number'],
select {
  height: var(--control-h);
}

input[type='search'],
input[type='text'],
textarea {
  width: 100%;
  padding: 0 10px;
}

input.mono {
  font-family: var(--font-mono);
  font-size: 13px;
}

textarea {
  min-height: 96px;
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.55;
  resize: vertical;
}

select {
  padding: 0 8px;
  cursor: pointer;
}

input::placeholder,
textarea::placeholder {
  color: var(--faint);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[readonly] {
  color: var(--muted);
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1 1 auto;
  min-width: 0;
}

.switch {
  appearance: none;
  position: relative;
  flex: none;
  width: 34px;
  height: 20px;
  margin: 0;
  border-radius: 999px;
  background: var(--switch-off);
  cursor: pointer;
}

.switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 25%);
}

.switch:checked {
  background: var(--switch-on);
}

.switch:checked::before {
  transform: translateX(14px);
}

.switch:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius);
  background: var(--fill);
  box-shadow: inset 0 0 0 1px var(--line);
}

.pills button {
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: 13px;
}

.pills button:hover:not(:disabled) {
  background: transparent;
  color: var(--ink);
}

.pills button[aria-pressed='true'],
.pills button[aria-pressed='true']:hover:not(:disabled) {
  background: var(--pill-on);
  color: var(--ink);
  box-shadow:
    0 0 0 1px var(--line-strong),
    0 1px 2px rgb(0 0 0 / 12%);
}

.pills button[aria-pressed='true'] .count {
  color: var(--muted);
}

.pills .count {
  margin-left: 2px;
  font-size: 12.5px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-search {
  position: relative;
  flex: 0 1 300px;
  min-width: 200px;
}

.toolbar-search svg {
  position: absolute;
  top: 50%;
  left: 11px;
  width: 16px;
  height: 16px;
  color: var(--muted);
  pointer-events: none;
  transform: translateY(-50%);
}

.toolbar-search input[type='search'] {
  padding-left: 34px;
  border-color: var(--line-strong);
  background: var(--surface);
}

.toolbar-search input::placeholder {
  color: var(--muted);
}

.toolbar-search:focus-within svg {
  color: var(--ink);
}

.primary-search {
  flex: 1 1 420px;
  max-width: 560px;
}

.primary-search input[type='search'] {
  height: 36px;
  font-size: 14px;
}

.policy-toolbar .pills button {
  height: 30px;
}

.policy-toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: -12px -8px;
  padding: 12px 8px;
  background: var(--bg);
}

.filter-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -16px;
  color: var(--muted);
  font-size: 13px;
}

.notice {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--fill);
  white-space: pre-wrap;
}

.notice.ok {
  border-color: var(--ok-border);
  background: var(--ok-bg);
  color: var(--ok-fg);
}

.notice.error {
  border-color: var(--err-border);
  background: var(--err-bg);
  color: var(--err-fg);
}

.notice.warn {
  border-color: var(--warn-border);
  background: var(--warn-bg);
  color: var(--warn-fg);
}

.notice a {
  font-weight: 500;
}

.notices {
  display: grid;
  gap: 8px;
}

.field-error {
  color: var(--err-fg);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.empty {
  padding: 24px 16px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-lg);
  color: var(--muted);
  text-align: center;
}

.card .empty {
  border: 0;
}

.footnote {
  margin-top: -16px;
  color: var(--faint);
  font-size: 13px;
}

.footnote:empty {
  display: none;
}

.status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.status-headline {
  font-size: 17px;
  font-weight: 600;
}

.status-facts {
  margin-top: 2px;
  color: var(--muted);
}

.attention-row {
  justify-content: space-between;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.tiles:empty {
  display: none;
}

.tile {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--ring);
}

.tile span {
  color: var(--muted);
  font-size: 13px;
}

.tile strong {
  display: block;
  margin-top: 4px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.tile-spark {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  width: min(45%, 160px);
  height: 34px;
}

.spark-bar {
  flex: 1 1 0;
  border-radius: 2px;
  background: var(--accent);
}

.spark-bar.spark-zero {
  background: var(--line-strong);
}

.compact-row,
.rule-count-row {
  align-content: center;
  align-items: baseline;
}

.compact-row {
  display: grid;
  grid-template-columns: 80px 110px minmax(0, 3fr) minmax(0, 2fr);
}

.compact-row time {
  color: var(--faint);
  font-size: 13px;
  white-space: nowrap;
}

.rule-count-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
}

.rule-count-row .count {
  text-align: right;
}

.rule-label {
  font-weight: 500;
}

.feed-agent {
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-command {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-rule {
  max-width: 30ch;
  overflow: hidden;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-heading {
  padding: 12px var(--row-x) 4px;
  color: var(--faint);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.day-heading:first-child {
  padding-top: 8px;
}

.feed-row {
  border-radius: var(--radius);
}

.feed-row:has(> [aria-expanded='true']) {
  background: var(--fill);
}

.feed-summary {
  display: grid;
  grid-template-columns: 16px 68px 76px 112px minmax(0, 3fr) minmax(0, 2fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 40px;
  padding: 0 var(--row-x);
  border: 0;
  border-radius: var(--radius);
  font-weight: 400;
  text-align: left;
}

.feed-summary time {
  color: var(--faint);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.decision {
  justify-self: start;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}

.decision.deny {
  background: var(--err-bg);
  color: var(--err-fg);
}

.decision.allow {
  background: var(--ok-bg);
  color: var(--ok-fg);
}

.decision.error {
  background: var(--warn-bg);
  color: var(--warn-fg);
}

.feed-detail {
  display: grid;
  gap: 12px;
  padding: 4px var(--row-x) 14px;
}

code.block {
  display: block;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--line);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.detail-rows {
  display: grid;
  gap: 4px;
}

.detail-rows div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
}

.detail-rows dt {
  color: var(--faint);
}

.detail-rows dd {
  overflow-wrap: anywhere;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-actions button:not(.primary) {
  background: var(--surface);
}

.rule-id {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 12.5px;
}

a.rule-id {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--line-strong);
  text-underline-offset: 3px;
}

a.rule-id:hover {
  text-decoration-color: currentColor;
}

.project-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: -12px;
  padding: 12px 16px;
  border: 1px solid var(--info-border);
  border-radius: var(--radius);
  background: var(--info-bg);
}

.project-bar code {
  overflow-wrap: anywhere;
}

.project-bar p {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.project-chip {
  flex: none;
  height: 22px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: var(--info-bg);
  color: var(--info-fg);
  font-size: 12px;
  font-weight: 500;
  line-height: 22px;
}

button.project-chip:hover:not(:disabled) {
  background: var(--info-bg);
  text-decoration: line-through;
}

.project-chip.inherited {
  background: var(--fill);
  color: var(--faint);
  font-weight: 400;
}

.project-chip-slot:empty {
  display: none;
}

.recovery {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--err-border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.recovery p {
  margin-top: 4px;
}

.page-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.tester-dialog {
  width: min(600px, calc(100vw - 32px));
}

.prompt-field {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  height: var(--control-h);
  padding-left: 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--field-bg);
  cursor: text;
}

.prompt-field:focus-within {
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 20%, transparent);
}

.prompt {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 13px;
}

.prompt-field input[type='text'] {
  height: 100%;
  padding: 0 10px 0 8px;
  border: 0;
  background: transparent;
}

.prompt-field input[type='text']:focus {
  box-shadow: none;
}

.tester-segment {
  margin-top: 6px;
}

.preset-status {
  margin-left: auto;
  color: var(--info-fg);
  font-size: 13px;
  font-weight: 500;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.preset-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-content: start;
  gap: 2px 10px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--ring);
  cursor: pointer;
}

.preset-card:hover {
  box-shadow: 0 0 0 1px var(--line-strong);
}

.preset-card input {
  margin: 4px 0 0;
  accent-color: var(--preset-fg);
}

.preset-name {
  font-weight: 600;
}

.preset-description {
  grid-column: 2;
  color: var(--muted);
  font-size: 13px;
}

.preset-standard {
  --preset-fg: var(--ok-fg);
  --preset-bg: var(--ok-bg);
  --preset-border: var(--ok-border);
}

.preset-strict {
  --preset-fg: var(--info-fg);
  --preset-bg: var(--info-bg);
  --preset-border: var(--info-border);
}

.preset-paranoid {
  --preset-fg: var(--paranoid-fg);
  --preset-bg: var(--paranoid-bg);
  --preset-border: var(--paranoid-border);
}

.preset-card:has(input:checked) {
  background: var(--preset-bg);
  box-shadow: 0 0 0 1px var(--preset-border);
}

.preset-card:has(input:checked) .preset-name {
  color: var(--preset-fg);
}

details > summary {
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  list-style: none;
  cursor: pointer;
}

details > summary::-webkit-details-marker {
  display: none;
}

details > summary::before,
.chevron::before {
  content: '';
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: translateX(-1px) rotate(-45deg);
}

details > summary::before {
  flex: none;
  margin: 0 4px;
}

details[open] > summary::before,
[aria-expanded='true'] > .chevron::before {
  transform: translateY(-1px) rotate(45deg);
}

.disclosure > summary {
  gap: 10px;
  width: auto;
  min-height: 48px;
  padding: 0 var(--card-x) 0 calc(var(--row-x) + 4px);
  border-radius: var(--radius-lg);
  font-weight: 600;
}

.disclosure > summary:hover {
  background: var(--hover);
}

.disclosure > summary::before {
  color: var(--faint);
}

.disclosure[open] > summary {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.disclosure-sub {
  overflow: hidden;
  color: var(--faint);
  font-size: 13px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.disclosure-body {
  padding: 0 var(--card-x) 4px 38px;
  border-top: 1px solid var(--line);
}

#environment-overrides {
  font-size: 13px;
}

.master-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.master-state {
  color: var(--err-fg);
  font-size: 13px;
  font-weight: 500;
}

.master-state .state-on,
.master-switch:has(:checked) .master-state .state-off {
  display: none;
}

.master-switch:has(:checked) .master-state {
  color: var(--muted);
}

.master-switch:has(:checked) .master-state .state-on {
  display: inline;
}

.is-off .section-sub {
  color: var(--err-fg);
}

.rule-group + .rule-group {
  margin-top: 2px;
}

.rule-group-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 0 var(--row-x);
  border-radius: var(--radius);
}

.rule-group-head:hover {
  background: var(--hover);
}

.group-toggle {
  flex: 1;
  align-self: stretch;
  justify-content: flex-start;
  gap: 8px;
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  font-weight: 600;
  text-align: left;
}

.group-toggle:hover:not(:disabled) {
  background: transparent;
}

.group-counts {
  margin-left: auto;
  color: var(--faint);
  font-size: 13px;
  font-weight: 400;
}

.off-count {
  color: var(--warn-fg);
}

.chevron {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--faint);
}

.rule-list {
  padding-bottom: 4px;
}

.rule-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px var(--row-x) 10px calc(var(--row-x) + 24px);
  border-radius: var(--radius);
}

.rule-row > .switch {
  margin-top: 1px;
}

.rule-row:hover {
  background: var(--hover);
}

.rule-row.row-disabled .rule-body {
  opacity: 0.5;
}

.rule-body {
  flex: 1;
  min-width: 0;
}

.rule-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px 10px;
  min-height: 22px;
}

.rule-line .quiet.small {
  height: 22px;
  margin-left: -4px;
  padding: 0 6px;
}

.rule-name {
  font-weight: 500;
}

.rule-description {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.tier-badge {
  align-self: center;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}

.tier-badge.strict {
  background: var(--info-bg);
  color: var(--info-fg);
}

.tier-badge.paranoid {
  background: var(--paranoid-bg);
  color: var(--paranoid-fg);
}

.rule-note {
  color: var(--faint);
  font-size: 13px;
}

.rule-note::before {
  content: '· ';
}

.rule-note.changed {
  color: var(--warn-fg);
}

.rule-note.strict {
  color: var(--info-fg);
}

.rule-note.paranoid {
  color: var(--paranoid-fg);
}

.rule-note:empty {
  display: none;
}

.lock {
  display: inline-flex;
  flex: none;
  justify-content: center;
  width: 34px;
  height: 22px;
  align-items: center;
  color: var(--faint);
}

.lock svg {
  width: 15px;
  height: 15px;
}

.info-button,
.info-spacer {
  flex: none;
  width: 26px;
  height: 26px;
}

.info-button {
  margin: -2px -4px 0 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--faint);
}

.info-button:hover:not(:disabled) {
  background: var(--hover);
  color: var(--ink);
}

.info-button svg {
  width: 16px;
  height: 16px;
}

.path-list {
  display: grid;
  gap: 8px;
  padding: 16px 0;
}

.path-list-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.path-list-head strong {
  font-weight: 500;
}

.path-list-help {
  margin-top: -6px;
  color: var(--muted);
  font-size: 13px;
}

.paths {
  display: grid;
  gap: 4px;
}

.paths:empty {
  display: none;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--control-h);
  padding: 0 2px 0 10px;
  border-radius: var(--radius-sm);
  background: var(--fill);
}

.path-item code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.path-item.row-disabled code {
  opacity: 0.5;
}

.json-body {
  position: relative;
  display: grid;
  padding: var(--card-x);
}

.json-body button {
  position: absolute;
  top: calc(var(--card-x) + 6px);
  right: calc(var(--card-x) + 6px);
  height: 28px;
  padding: 0 8px;
}

#raw {
  min-height: 300px;
}

.savebar {
  position: sticky;
  bottom: 16px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 10px 10px 18px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-float);
}

.savebar-text {
  display: grid;
  min-width: 0;
}

.savebar-text strong {
  font-weight: 500;
}

.savebar-text span {
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.savebar-actions {
  display: flex;
  gap: 8px;
}

.rulebook {
  display: grid;
  gap: 8px;
}

.rulebook + .rulebook {
  margin-top: 16px;
}

.rulebook-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--muted);
  font-size: 13px;
}

.rulebook-head strong {
  color: var(--ink);
  font-size: 14px;
}

.rulebook-rule {
  display: grid;
  gap: 4px;
}

.rulebook-rule.focused {
  margin: 0 calc(-1 * var(--card-x));
  padding-right: var(--card-x);
  padding-left: calc(var(--card-x) - 3px);
  border-left: 3px solid var(--focus-ring);
  background: var(--fill);
}

.rulebook-rule-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
}

.rulebook-rule .command {
  font-weight: 600;
}

.rulebook-rule p.muted {
  font-size: 13px;
}

.form-grid {
  display: grid;
  gap: 18px;
}

.field {
  display: grid;
  gap: 6px;
}

.field-label {
  font-weight: 500;
}

.field .pills {
  justify-self: start;
}

.field small {
  color: var(--muted);
  font-size: 13px;
}

#rules-composer-input {
  font-family: var(--font-sans);
  font-size: 14px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.chip-row-label {
  color: var(--faint);
  font-size: 13px;
}

button.chip {
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: var(--fill);
  color: var(--muted);
  font-size: 13px;
}

button.chip:hover:not(:disabled) {
  background: var(--selected);
  color: var(--ink);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.agent-groups {
  display: grid;
  gap: 28px;
}

.agent-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 200px) 130px 96px;
  align-items: baseline;
  gap: 4px 16px;
}

.agent-name {
  font-weight: 500;
}

.agent-version {
  overflow: hidden;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-status {
  color: var(--muted);
  font-size: 13px;
}

.agent-status.active {
  color: var(--ok-fg);
}

.agent-status.disabled {
  color: var(--warn-fg);
}

.agent-action {
  justify-self: end;
}

.agent-row .notice {
  grid-column: 1 / -1;
}

.missing-agents summary {
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.missing-agents summary:hover {
  color: var(--ink);
}

.retention-input {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
}

.retention-input input {
  width: 72px;
  padding: 0 8px;
  text-align: right;
}

#project-policy-notice {
  font-size: 13px;
}

.toast {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: min(400px, calc(100vw - 32px));
  padding: 12px 8px 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-float);
}

.toast::before {
  content: '';
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--faint);
}

.toast.ok::before {
  background: var(--ok-fg);
}

.toast.error::before {
  background: var(--err-fg);
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-text strong {
  font-weight: 500;
}

.toast-text p {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.toast .icon-only {
  margin-top: -3px;
  border: 0;
  color: var(--faint);
}

.rule-example-popover,
.confirm-dialog {
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
}

.rule-example-popover {
  position: fixed;
  inset: auto;
  width: min(380px, calc(100vw - 24px));
  margin: 0;
  padding: 14px;
  box-shadow: var(--shadow-float);
}

.rule-example-popover::backdrop {
  background: transparent;
}

.rule-example-popover > * {
  display: block;
}

.rule-example-label {
  color: var(--faint);
  font-size: 12px;
}

.rule-example-popover strong {
  margin-top: 2px;
  font-weight: 500;
}

.rule-example-popover p {
  margin: 2px 0 10px;
  color: var(--muted);
  font-size: 13px;
}

.rule-example-popover code {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--fill);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.rule-example-popover p + code {
  margin-top: 0;
}

.confirm-dialog {
  width: min(440px, calc(100vw - 32px));
  padding: 0;
  box-shadow:
    0 0 0 1px var(--line-strong),
    0 16px 48px rgb(0 0 0 / 24%);
}

.confirm-dialog::backdrop {
  background: rgb(0 0 0 / 45%);
}

.confirm-dialog form {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.confirm-dialog h2 {
  font-size: 16px;
  font-weight: 600;
}

.confirm-dialog form > p {
  color: var(--muted);
}

.confirm-dialog:has(.dialog-rows:not([hidden])) {
  width: min(640px, calc(100vw - 32px));
}

.report-dialog {
  width: min(680px, calc(100vw - 32px));
}

.dialog-detail {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--fill);
  overflow-wrap: anywhere;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.dialog-rows {
  display: grid;
  gap: 8px;
  max-height: 46vh;
  overflow: auto;
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.diff-table th {
  padding: 4px 8px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-weight: 500;
}

.diff-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
  overflow-wrap: anywhere;
  vertical-align: top;
}

.diff-before {
  color: var(--muted);
  text-decoration: line-through;
}

.diff-after {
  font-weight: 500;
}

.report-field {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
}

.star-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 16px;
  border-radius: var(--radius-lg);
  box-shadow: 0 0 0 1px var(--line);
}

.star-pitch {
  flex: 1;
  min-width: 0;
  color: var(--muted);
  font-size: 13px;
}

.star-pitch strong {
  color: var(--ink);
}

.star-cta {
  gap: 8px;
  text-decoration: none;
}

.star-icon {
  display: inline-flex;
  color: var(--star);
}

.star-icon svg {
  width: 15px;
  height: 15px;
}

.star-count {
  padding-left: 8px;
  border-left: 1px solid var(--line-strong);
  color: var(--muted);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

.star-cta.starred:disabled {
  opacity: 1;
  cursor: default;
}

@media (max-width: 860px) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .sidebar {
    z-index: 100;
    height: auto;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .brand {
    padding: 0;
  }

  .brand-logo svg {
    height: 22px;
  }

  .sidenav {
    display: flex;
    flex: 1;
    justify-content: flex-end;
  }

  .sidenav a {
    position: relative;
    padding: 0 8px;
  }

  .sr-only-collapse {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .nav-dirty {
    position: absolute;
    top: 3px;
    right: 2px;
    width: 7px;
    height: 7px;
    padding: 0;
    overflow: hidden;
    border-radius: 50%;
    background: var(--warn-fg);
    color: transparent;
  }

  .sidebar-foot {
    display: none;
  }

  .app-foot {
    display: flex;
    justify-content: center;
    gap: 28px;
    padding: 16px;
    border-top: 1px solid var(--line);
    font-size: 13px;
  }

  .preset-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .feed-summary {
    grid-template-columns: 16px 64px 72px minmax(0, 1fr);
  }

  .feed-summary .feed-agent,
  .feed-summary .feed-rule,
  .compact-row .feed-agent,
  .compact-row .feed-rule {
    display: none;
  }

  .compact-row {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .rule-count-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .agent-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .agent-status:empty {
    display: none;
  }

  .agent-version {
    display: none;
  }
}

@media (max-width: 640px) {
  main {
    padding: 24px 16px 56px;
  }

  .tiles {
    grid-template-columns: minmax(0, 1fr);
  }

  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-head .section-actions {
    justify-content: space-between;
  }

  .panel-head .section-actions > .quiet {
    margin-left: -13px;
  }

  .setting-row.info button {
    align-self: flex-start;
    margin-left: -9px;
  }

  .toolbar-search {
    flex: 1 1 100%;
  }

  .rule-row {
    padding-left: var(--row-x);
  }

  .status-card,
  .savebar,
  .project-bar,
  .recovery,
  .setting-row {
    flex-direction: column;
    align-items: stretch;
  }

  .setting-label {
    width: auto;
  }

  .detail-rows div {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}

  </style>
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <h1 class="brand-logo"><a class="brand-home" href="#overview" data-i18n-title="navOverview"><svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 476.62 104" role="img" aria-label="CC Safety Net"><defs><style>@font-face{font-family:'Exo 2 Kit';font-style:italic;font-weight:700;src:url(data:font/woff2;base64,d09GMgABAAAAAAbUAA8AAAAADAQAAAZ7AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGjYbgyQcVgZgP1NUQVRAAGwRCAqJMIdOCxgAATYCJAMsBCAFhDAHIBsHClEU84FMI2Xh/P0gqJpmz2glW7tm2AMGEwsNLDMfvC6JFAYQpPIEwhmU0xSaCF+QTsL/fr9W/1uXRBItlZA9tc/Z9Yv5Q0SSmDWGUAhNRJtlK9FLKKzDiVzMJj0vnDSdSSQEYLKYQBuCGLPALmhtxAISi2ZWHkV0ILcjDR6rs5GDaEcLyx1kdcyODZDVPebrJ2ugbWKILNkBQClYW9HvGxsiWjnNmOQ2JJovesQSRNmQRxoiskig7/FcAHZApkhZYgQ4vYi+qS95Gzs6m+iq/1ig/tdrUQqZrv4fjgwrgfpH/e7GW5n6Rzb9rL5X3/AAgsmcGyQaVq7JNiJbGiDQZxuRxpooiyzIdHCygPSC5IIkIFKwSFffp0/wUjYjKS5NoogLGOjtbnM8VaGhpYcTCWfSUjvZhhtRk4XySaxdpF961G+UqQ3YJJrZLFYS7HMtUh3GLHs+p7KqsoDrMJm1fKF2iC7aKbHDRFwSXCG+l/fnQdB25gYOKUdhafl0d8/Ev9X3TrQNCAYogYfEsePJ6XcDIkE+aQUGZDElS2BgChoenkQCb1eZHKGSOtroYoLZtB/wLvNdq75WT6sH1b3qBnWtukCdgz+U6igQShF/JUOyNCFZJfr1MiFZOyaLnIwFRmUW0AYPWrx061Lb+kxrvDXVyMy0tjTqLbHTwJjYnJjGp/YHQi8tc9z88su6/9Vng45g6C0jENnhfDGo+8Nhd0R+6HTjpbfquv/2rPrLr8/ST16b4dFbrrjDMAK3ZXovuy/TuPyG7Ib+QKjAcXM4rPsfvPHSjEsvu22Z87X3QmZQ3Fv3h13ul0IvGYFX7si+4vLbl7tefz+cf0NEFHQHQnb9D3+x/633mtcGb1txyzsfbFh3r8g+Gpy3czo9uns56BDzymeDRx1u9y2P/CLj4aXwT+UEQ48ZgUhkhfPGoK9H9QdeemmZQ/c/mtMY8MztbiPwRH5LJOJ0xLjd/Z4PFZ3Y2KYtKytYWYfM1o6jlwQ37O/v73Ps7++bmI0fbR0JDx8dmWNZVmJjm1AeGdoMne0IeN3GBh0HOR0H+47/9ql9Gn1m9n0WfSBpVlAV3nVM7PeauM3NbuRAaYXWwDZF2iOE1W3gy8gAWmccde8oddY6wmQ8F/50bf1ARjA/aBkrVUGtQ+mZVuBZ+mCJQ80mLVFUYBErNUGtRWlVmmNbxhaHh8ssJZYHzOfEQnHscF1eNIA2YKd06v4TI/YqqooRdgvH13JC60gb+dNZsyZgaeLjeTeYQgsIuaV6ZFg9EyySJdSi8LVsPNg1lNjs8IDyH5UCXAnVyeKiH6gIaBlPziUdcoFCeEFDY1VLvZSGhaPgkAJURRI/Etcax4TPRV3ADq+EqBCtdBkM8acG8n/WTmyMOum+94aU9/8kWIZ7JE1cEmziR2Lb9NVzFDEYBVzFT24KZagafAljfa6Nr4tkcvaRZg7DmKF1uBxVxJzJgMw2SeOKCqmtJbuMhakeWlnf0JhSETFCaifPzmNurIelamAwcovrEIBtbQEH3GHKZ1LEtMpIF1YNYgJVNa16jW9UBq5DCLa1PRzIPwZQuTI6s1ix6NIKmnp7RwtrwvDMtBSp1iS1Vk95QpnScY0vOaMZCCXYHVzJ/0V0Z4D0CrFjsjCpnT67jIWJMkZZz9CYUhExQmon72HF3qK6I/aC6qrHjZTrXjya2uRdsdfj2G8/WlVdm3VQeyi1af/KvcV1++0F1dUPfBzTGtEbvBoA6lkEIOU5eY+UL7TE7/0t2mL5EuCta2OSAD5Zdv4v/7v//0j7WSvBQguGTaGAOu3L1vj/3f/9qf1s+ZKzaorXNGQla2UJS+Vb5MgC4mUNGXIrGeJcdZG4FFMWsEz+oS7iw/pscwadRDFAVM3j1AUG/mu6Zh/brxcaWorkv2WoJI1PQy1s5V5RFi3mbBlqJYuJUBt5uArj2F4Xi9IvegbJKZJp8mhKaDVeephhBuikhAnaGKCXDtz46KWbHib2nScYYZzdbBj5hnWdjyG6RkVDTIDxdtE4PtYzzBjdFDCjVt/MOmzmahhjnF7zk0w2s56NbGKjCd5SzeVkczwA9lf2UEkVlRSwx9UIUAa4oSOESmYZI4wAOPjqFkwc9ODD9Cu/mrFxQx8+OoD8EJM8gfj645is5Ix30xt51CTtrKeDYQYD+g8zTDcD+NgsGmeDm+R1RP2rWpqtqT9BXclmNgA=) format('woff2')}</style></defs><svg x="0" y="0" width="96" height="96" viewBox="-172.38 -172.38 824.77 824.77"><g transform="rotate(45 240 240)"><rect x="-30" y="14" width="195" height="52" rx="9" fill="currentColor"/><rect x="315" y="14" width="195" height="52" rx="9" fill="currentColor"/><rect x="-30" y="94" width="115" height="52" rx="9" fill="currentColor"/><rect x="235" y="94" width="170" height="52" rx="9" fill="currentColor"/><rect x="155" y="174" width="170" height="52" rx="9" fill="currentColor"/><rect x="75" y="254" width="170" height="52" rx="9" fill="currentColor"/><rect x="395" y="254" width="115" height="52" rx="9" fill="currentColor"/><rect x="-30" y="334" width="195" height="52" rx="9" fill="currentColor"/><rect x="315" y="334" width="195" height="52" rx="9" fill="currentColor"/><rect x="-30" y="414" width="115" height="52" rx="9" fill="currentColor"/><rect x="235" y="414" width="170" height="52" rx="9" fill="currentColor"/><rect x="14" y="155" width="52" height="170" rx="9" fill="#e5602a"/><rect x="94" y="75" width="52" height="170" rx="9" fill="#e5602a"/><rect x="94" y="395" width="52" height="115" rx="9" fill="#e5602a"/><rect x="174" y="-30" width="52" height="195" rx="9" fill="#e5602a"/><rect x="174" y="315" width="52" height="195" rx="9" fill="#e5602a"/><rect x="254" y="-30" width="52" height="115" rx="9" fill="#e5602a"/><rect x="254" y="235" width="52" height="170" rx="9" fill="#e5602a"/><rect x="334" y="155" width="52" height="170" rx="9" fill="#e5602a"/><rect x="414" y="75" width="52" height="170" rx="9" fill="#e5602a"/><rect x="414" y="395" width="52" height="115" rx="9" fill="#e5602a"/></g></svg><text x="115.98" y="62.42" font-family="'Exo 2 Kit','Exo 2',sans-serif" font-style="italic" font-weight="700" font-size="56" letter-spacing="-0.56" fill="currentColor">CC Safety Net</text></svg>
</a></h1>
      </div>
      <nav class="sidenav" data-i18n-aria-label="navSections">
        <a href="#overview" data-nav="overview" data-i18n-title="navOverview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1.5"></rect><rect x="14" y="3" width="7" height="5" rx="1.5"></rect><rect x="14" y="12" width="7" height="9" rx="1.5"></rect><rect x="3" y="16" width="7" height="5" rx="1.5"></rect></svg><span class="sr-only-collapse" data-i18n="navOverview"></span></a>
        <a href="#activity" data-nav="activity" data-i18n-title="navActivity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4"></path></svg><span class="sr-only-collapse" data-i18n="navActivity"></span></a>
        <a href="#policy" data-nav="policy" data-i18n-title="navProtections"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6l-7-3Z"></path></svg><span class="sr-only-collapse" data-i18n="navProtections"></span><span class="nav-dirty" id="nav-dirty" data-i18n="navUnsaved" hidden></span></a>
        <a href="#rules" data-nav="rules" data-i18n-title="navCustomRules"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v4h4"></path><path d="M9 12h6M9 16h4"></path></svg><span class="sr-only-collapse" data-i18n="navCustomRules"></span></a>
        <a href="#integrations" data-nav="integrations" data-i18n-title="navAgents"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5"></path></svg><span class="sr-only-collapse" data-i18n="navAgents"></span></a>
        <a href="#settings" data-nav="settings" data-i18n-title="navSettings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h10M18 8h2M4 16h2M10 16h10"></path><circle cx="16" cy="8" r="2.2"></circle><circle cx="8" cy="16" r="2.2"></circle></svg><span class="sr-only-collapse" data-i18n="navSettings"></span></a>
      </nav>
      <div class="sidebar-foot">
        <a href="https://github.com/kenryu42/cc-safety-net" target="_blank" rel="noopener">GitHub</a>
        <a href="https://ccsafetynet.com/docs" target="_blank" rel="noopener" data-i18n="documentation"></a>
        <label class="language-picker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"></path></svg><select data-language-select data-i18n-aria-label="language"><option value="en" lang="en">English</option><option value="ja" lang="ja">日本語</option><option value="zh-CN" lang="zh-CN">简体中文</option></select></label>
      </div>
    </aside>
    <div class="content">
      <main>
        <div class="banner" id="protection-banner" role="alert" hidden></div>

        <section class="view" data-view="overview">
          <header class="page-head">
            <div>
              <h2 data-i18n="navOverview"></h2>
              <p data-i18n="overviewIntro"></p>
            </div>
          </header>
          <div class="card status-card" id="status-card" aria-live="polite"><p class="muted" data-i18n="loading"></p></div>
          <section class="section" id="attention" hidden>
            <div class="section-head"><h3 class="section-title" data-i18n="needsAttention"></h3></div>
            <ul class="card list" id="attention-list"></ul>
          </section>
          <div class="tiles" id="overview-tiles"></div>
          <section class="section">
            <div class="section-head">
              <h3 class="section-title" data-i18n="recentBlocks"></h3>
              <a class="link-button" href="#activity" data-i18n="allActivity"></a>
            </div>
            <div id="recent-blocks"></div>
          </section>
          <section class="section">
            <div class="section-head">
              <h3 class="section-title" id="top-rules-title" data-i18n="topRules"></h3>
            </div>
            <div id="top-rules"></div>
          </section>
          <div class="star-row" id="star-row" hidden>
            <p class="star-pitch"><span id="star-pitch-text"></span></p>
            <span id="star-slot"></span>
          </div>
        </section>

        <section class="view" data-view="activity" hidden>
          <header class="page-head">
            <div>
              <h2 data-i18n="navActivity"></h2>
              <p data-i18n="activityIntro"></p>
            </div>
            <button type="button" class="quiet icon-button" id="activity-refresh" data-i18n-aria-label="refreshActivity" data-i18n-title="refreshActivity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v7h-7"></path></svg></button>
          </header>
          <div class="toolbar">
            <div class="pills" id="activity-decision" role="group" data-i18n-aria-label="decisionFilter"></div>
            <span class="toolbar-spacer"></span>
            <label class="toolbar-search"><span class="sr-only" data-i18n="searchActivity"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input type="search" id="activity-search" autocomplete="off" data-i18n-placeholder="searchActivityPlaceholder"></label>
            <label class="toolbar-select"><span class="sr-only" data-i18n="agentFilter"></span><select id="activity-agent"></select></label>
            <label class="toolbar-select"><span class="sr-only" data-i18n="timeWindow"></span><select id="activity-days"></select></label>
          </div>
          <div class="filter-line" id="activity-command-filter" hidden></div>
          <div class="card list" id="activity-feed"><p class="empty" data-i18n="loadingActivity"></p></div>
          <p class="footnote" id="activity-count"></p>
        </section>

        <section class="view" data-view="policy" hidden>
          <header class="page-head">
            <div>
              <h2 data-i18n="navProtections"></h2>
              <p data-i18n="policyIntro"></p>
            </div>
            <div class="page-actions">
              <div class="pills" role="group" data-i18n-aria-label="policyScope">
                <button type="button" id="scope-user" aria-pressed="true" data-i18n="myPolicy"></button>
                <button type="button" id="project-draft-enter" aria-pressed="false" data-i18n="projectPolicy"></button>
              </div>
              <button type="button" id="tester-open" aria-haspopup="dialog" data-i18n="testCommand"></button>
            </div>
          </header>
          <div class="project-bar" id="project-draft-bar" hidden>
            <div>
              <strong data-i18n="editingProjectPolicy"></strong> <code id="project-draft-path"></code>
              <p data-i18n-html="projectBarHelp"></p>
            </div>
            <button type="button" id="project-draft-change" data-i18n="changeFolder" hidden></button>
          </div>
          <p class="notice error" id="project-draft-diagnostics" hidden></p>
          <div class="recovery" id="recovery" hidden>
            <div>
              <strong data-i18n="statusRepair"></strong>
              <p data-i18n="repairHelp"></p>
              <p class="notice error" id="policy-errors"></p>
            </div>
            <button class="primary" id="repair" type="button" data-i18n="repair"></button>
          </div>

          <section class="section">
            <div class="section-head">
              <div>
                <h3 class="section-title" data-i18n="safetyPreset"></h3>
                <p class="section-sub" data-i18n="safetyPresetSub"></p>
              </div>
              <span class="preset-status" id="safety-preset-status"></span>
              <span class="project-chip-slot" id="safety-level-chip"></span>
            </div>
            <div class="preset-grid" id="safety-level"></div>
            <p class="notice" id="environment-overrides" hidden></p>
            <details class="card disclosure">
              <summary><span class="disclosure-title" data-i18n="advancedSettings"></span><span class="disclosure-sub" data-i18n="advancedSettingsSub"></span></summary>
              <div class="disclosure-body">
                <div id="safety-overrides"></div>
                <div id="workflow"></div>
              </div>
            </details>
          </section>

          <div class="toolbar policy-toolbar">
            <label class="toolbar-search primary-search"><span class="sr-only" data-i18n="searchProtections"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input type="search" id="policy-search" autocomplete="off" aria-keyshortcuts="/" data-i18n-placeholder="searchProtectionsPlaceholder"></label>
            <div class="pills" role="group" data-i18n-aria-label="protectionsShown">
              <button type="button" data-policy-show="all" aria-pressed="true" data-i18n="filterAll"></button>
              <button type="button" data-policy-show="changed" aria-pressed="false"><span data-i18n="showChanged"></span> <span class="count" id="changed-count"></span></button>
            </div>
          </div>

          <section class="card panel" id="destructive-panel">
            <div class="panel-head">
              <div>
                <h3 class="section-title" id="destructive-label" data-i18n="commandProtection"></h3>
                <p class="section-sub" id="destructive-command-summary"></p>
              </div>
              <div class="section-actions">
                <button type="button" class="quiet" id="reset-rule-customizations" data-i18n="resetAll"></button>
                <span class="project-chip-slot" id="destructive-enabled-chip"></span>
                <label class="master-switch"><span class="master-state"><span class="state-on" data-i18n="switchOn"></span><span class="state-off" data-i18n="switchOff"></span></span><input type="checkbox" class="switch" id="destructive-enabled" aria-labelledby="destructive-label"></label>
              </div>
            </div>
            <div class="panel-list" id="destructive-command-rules"></div>
          </section>

          <section class="card panel" id="secret-panel">
            <div class="panel-head">
              <div>
                <h3 class="section-title" id="secret-label" data-i18n="secretProtection"></h3>
                <p class="section-sub" id="secret-summary"></p>
              </div>
              <div class="section-actions">
                <button type="button" class="quiet" id="reset-secret-customizations" data-i18n="resetAll"></button>
                <span class="project-chip-slot" id="secret-enabled-chip"></span>
                <label class="master-switch"><span class="master-state"><span class="state-on" data-i18n="switchOn"></span><span class="state-off" data-i18n="switchOff"></span></span><input type="checkbox" class="switch" id="secret-enabled" aria-labelledby="secret-label"></label>
              </div>
            </div>
            <div class="panel-list" id="secret-patterns"></div>
          </section>

          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3 class="section-title" data-i18n="pathsTitle"></h3>
                <p class="section-sub" data-i18n-html="pathsSub"></p>
              </div>
            </div>
            <div class="panel-rows">
              <div class="path-list">
                <div class="path-list-head"><strong id="allow-paths-label" data-i18n="allowPathsLabel"></strong><span class="count" id="allow-paths-count"></span><span class="project-chip-slot" id="allow-paths-chip"></span></div>
                <p class="path-list-help" data-i18n-html="allowPathsHelp"></p>
                <div class="input-row"><input type="text" class="mono" id="allow-paths-input" data-path-input="allow-paths" autocomplete="off" spellcheck="false" data-i18n-placeholder="allowPathsPlaceholder" aria-labelledby="allow-paths-label"><button type="button" id="allow-paths-add-button" data-path-add="allow-paths" data-i18n="add"></button></div>
                <p class="field-error" id="allow-paths-hint" hidden></p>
                <ul class="paths" id="allow-paths-list"></ul>
              </div>
              <div class="path-list">
                <div class="path-list-head"><strong id="deny-paths-label" data-i18n="denyPathsLabel"></strong><span class="count" id="deny-paths-count"></span><span class="project-chip-slot" id="deny-paths-chip"></span></div>
                <p class="path-list-help" data-i18n="denyPathsHelp"></p>
                <div class="input-row"><input type="text" class="mono" id="deny-paths-input" data-path-input="deny-paths" autocomplete="off" spellcheck="false" data-i18n-placeholder="denyPathsPlaceholder" aria-labelledby="deny-paths-label"><button type="button" id="deny-paths-add-button" data-path-add="deny-paths" data-i18n="add"></button></div>
                <p class="field-error" id="deny-paths-hint" hidden></p>
                <ul class="paths" id="deny-paths-list"></ul>
              </div>
              <div class="path-list">
                <div class="path-list-head"><strong id="secret-allow-paths-label" data-i18n="secretAllowPathsLabel"></strong><span class="count" id="secret-allow-paths-count"></span><span class="project-chip-slot" id="secret-allow-paths-chip"></span></div>
                <p class="path-list-help" data-i18n-html="secretAllowPathsHelp"></p>
                <div class="input-row"><input type="text" class="mono" id="secret-allow-paths-input" data-path-input="secret-allow-paths" autocomplete="off" spellcheck="false" placeholder="~/code/**/.env.local" aria-labelledby="secret-allow-paths-label"><button type="button" id="secret-allow-paths-add-button" data-path-add="secret-allow-paths" data-i18n="add"></button></div>
                <p class="field-error" id="secret-allow-paths-hint" hidden></p>
                <ul class="paths" id="secret-allow-paths-list"></ul>
              </div>
            </div>
          </section>

          <details class="card disclosure">
            <summary><span class="disclosure-title" data-i18n="policyJson"></span><span class="disclosure-sub" id="raw-source" data-i18n="rawReadOnly"></span></summary>
            <div class="disclosure-body json-body">
              <button type="button" class="quiet" id="raw-copy"></button>
              <textarea id="raw" data-i18n-aria-label="policyJson" aria-describedby="raw-source" readonly></textarea>
            </div>
          </details>

          <div class="savebar" id="policy-savebar" hidden>
            <div class="savebar-text">
              <strong id="savebar-title" data-i18n="unsavedChanges"></strong>
              <span id="savebar-summary"></span>
            </div>
            <div class="savebar-actions">
              <button type="button" id="discard-changes" data-i18n="discard"></button>
              <button type="button" class="primary" id="save" data-i18n="save"></button>
            </div>
          </div>
        </section>

        <section class="view" data-view="rules" hidden>
          <header class="page-head">
            <div>
              <h2 data-i18n="navCustomRules"></h2>
              <p data-i18n="rulesIntro"></p>
            </div>
            <button type="button" class="quiet icon-button" id="rules-refresh" data-i18n-aria-label="refreshRules" data-i18n-title="refreshRules"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v7h-7"></path></svg></button>
          </header>
          <section class="section" id="rules-diagnostics-panel" hidden>
            <div class="section-head">
              <div>
                <h3 class="section-title" data-i18n="problems"></h3>
                <p class="section-sub" data-i18n="problemsSub"></p>
              </div>
            </div>
            <div class="notices" id="rules-diagnostics"></div>
          </section>
          <section class="section">
            <div class="section-head">
              <div>
                <h3 class="section-title" data-i18n="rulebooks"></h3>
                <p class="section-sub" data-i18n="rulebooksSub"></p>
              </div>
            </div>
            <div id="rules-list"><p class="empty" data-i18n="loadingRules"></p></div>
          </section>
          <section class="section" id="rules-composer-panel">
            <div class="section-head">
              <div>
                <h3 class="section-title" data-i18n="createRule"></h3>
                <p class="section-sub" data-i18n="createRuleSub"></p>
              </div>
            </div>
            <div class="card pad">
              <div class="form-grid">
                <div class="field">
                  <span class="field-label" data-i18n="appliesTo"></span>
                  <div class="pills" role="group" data-i18n-aria-label="ruleScope">
                    <button type="button" data-rules-scope="project" aria-pressed="true" data-i18n="thisProject"></button>
                    <button type="button" data-rules-scope="user" aria-pressed="false" data-i18n="allProjects"></button>
                  </div>
                </div>
                <div class="field" id="rules-project-path-field">
                  <label class="field-label" id="rules-project-path-label" for="rules-project-path" data-i18n="projectFolder"></label>
                  <div class="input-row">
                    <input type="text" class="mono" id="rules-project-path" spellcheck="false" autocomplete="off" aria-describedby="rules-project-path-hint">
                    <button type="button" id="rules-choose-directory" data-i18n="chooseFolder" hidden></button>
                  </div>
                  <small id="rules-project-path-hint" data-i18n="projectFolderHint"></small>
                </div>
                <div class="field">
                  <label class="field-label" id="rules-composer-label" for="rules-composer-input" data-i18n="ruleRequest"></label>
                  <textarea id="rules-composer-input" spellcheck="false" data-i18n-placeholder="ruleRequestPlaceholder" aria-describedby="rules-composer-hint"></textarea>
                  <small id="rules-composer-hint" data-i18n="ruleRequestHint"></small>
                  <div class="chip-row">
                    <span class="chip-row-label" data-i18n="tryExamples"></span>
                    <button type="button" class="chip" data-rules-example="suggest" data-i18n="exampleSuggest"></button>
                    <button type="button" class="chip" data-rules-example="block" data-i18n="exampleBlock"></button>
                    <button type="button" class="chip" data-rules-example="verify" data-i18n="exampleVerify"></button>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="primary" id="rules-copy-prompt" data-i18n="copyPrompt"></button>
              </div>
            </div>
          </section>
        </section>

        <section class="view" data-view="integrations" hidden>
          <header class="page-head">
            <div>
              <h2 data-i18n="navAgents"></h2>
              <p data-i18n="agentsIntro"></p>
            </div>
            <button type="button" class="quiet icon-button" id="integrations-refresh" data-i18n-aria-label="refreshAgents" data-i18n-title="refreshAgents"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v7h-7"></path></svg></button>
          </header>
          <div class="agent-groups" id="integrations-list"><p class="empty" data-i18n="checkingAgents"></p></div>
        </section>

        <section class="view" data-view="settings" hidden>
          <header class="page-head">
            <div>
              <h2 data-i18n="navSettings"></h2>
              <p data-i18n="settingsIntro"></p>
            </div>
          </header>
          <section class="section">
            <div class="section-head"><h3 class="section-title" data-i18n="appearance"></h3></div>
            <div class="card rows">
              <div class="setting-row">
                <div class="setting-text"><strong data-i18n="theme"></strong><small data-i18n="preferenceHint"></small></div>
                <div class="pills" id="settings-theme" role="group" data-i18n-aria-label="theme">
                  <button type="button" data-theme-choice="auto" aria-pressed="true" data-i18n="themeAuto"></button>
                  <button type="button" data-theme-choice="light" aria-pressed="false" data-i18n="themeLight"></button>
                  <button type="button" data-theme-choice="dark" aria-pressed="false" data-i18n="themeDark"></button>
                </div>
              </div>
            </div>
          </section>
          <section class="section">
            <div class="section-head"><h3 class="section-title" data-i18n="auditLog"></h3></div>
            <div class="card rows">
              <div class="setting-row">
                <div class="setting-text"><label for="retention-days"><strong data-i18n="keepLogsFor"></strong></label><small id="retention-note" data-i18n="retentionNote"></small></div>
                <span class="retention-input"><input type="number" id="retention-days" min="1" max="365" step="1" inputmode="numeric" aria-describedby="retention-note"><span id="retention-unit"></span></span>
              </div>
              <div class="setting-row info"><span class="setting-label" data-i18n="logFolder"></span><code id="logs-path"></code><button type="button" class="quiet small" data-copy-path="logs-path" data-i18n-aria-label="copyLogFolder"></button></div>
            </div>
          </section>
          <section class="section">
            <div class="section-head"><h3 class="section-title" data-i18n="files"></h3></div>
            <div class="card rows">
              <div class="setting-row info"><span class="setting-label" data-i18n="policyFile"></span><code id="policy-path"></code><button type="button" class="quiet small" data-copy-path="policy-path" data-i18n-aria-label="copyPolicyPath"></button></div>
              <div class="setting-row info" id="project-policy-row" hidden><span class="setting-label" data-i18n="projectPolicy"></span><code id="project-policy-path"></code><button type="button" class="quiet small" data-copy-path="project-policy-path" data-i18n-aria-label="copyProjectPolicyPath"></button></div>
            </div>
            <p class="notice" id="project-policy-notice" hidden></p>
          </section>
          <section class="section">
            <div class="section-head"><h3 class="section-title" data-i18n="about"></h3></div>
            <div class="card rows">
              <div class="setting-row info"><span class="setting-label">CC Safety Net</span><code id="app-version"></code></div>
              <div class="setting-row info"><span class="setting-label">Node.js</span><code id="integrations-node-version"></code></div>
              <div class="setting-row info"><span class="setting-label" data-i18n="platform"></span><code id="integrations-platform"></code></div>
            </div>
          </section>
          <section class="section">
            <div class="section-head"><h3 class="section-title" data-i18n="dangerZone"></h3></div>
            <div class="card rows">
              <div class="setting-row">
                <div class="setting-text"><strong data-i18n="resetPolicy"></strong><small data-i18n="resetPolicyHelp"></small></div>
                <button type="button" class="danger-quiet" id="reset" data-i18n="resetPolicy"></button>
              </div>
            </div>
          </section>
        </section>
      </main>
      <footer class="app-foot">
        <a href="https://github.com/kenryu42/cc-safety-net" target="_blank" rel="noopener">GitHub</a>
        <a href="https://ccsafetynet.com/docs" target="_blank" rel="noopener" data-i18n="documentation"></a>
        <label class="language-picker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"></path></svg><select data-language-select data-i18n-aria-label="language"><option value="en" lang="en">English</option><option value="ja" lang="ja">日本語</option><option value="zh-CN" lang="zh-CN">简体中文</option></select></label>
      </footer>
    </div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden>
    <div class="toast-text">
      <strong id="toast-title"></strong>
      <p id="toast-detail" hidden></p>
    </div>
    <button type="button" class="quiet icon-only" id="toast-close" data-i18n-aria-label="dismissMessage">✕</button>
  </div>
  <div class="rule-example-popover" id="rule-example-popover" popover="auto" role="dialog" aria-labelledby="rule-example-title" aria-describedby="rule-example-command">
    <span class="rule-example-label" id="rule-example-label"></span>
    <strong id="rule-example-title"></strong>
    <p id="rule-example-description"></p>
    <code id="rule-example-command"></code>
  </div>
  <dialog class="confirm-dialog" id="confirm-dialog" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-body confirm-dialog-detail">
    <form method="dialog">
      <h2 id="confirm-dialog-title"></h2>
      <p id="confirm-dialog-body"></p>
      <div class="dialog-rows" id="confirm-dialog-rows" hidden></div>
      <p class="dialog-detail"><code id="confirm-dialog-detail"></code></p>
      <div class="dialog-actions">
        <button type="submit" id="confirm-dialog-cancel" value="cancel" data-i18n="cancel"></button>
        <button type="submit" class="danger" id="confirm-dialog-confirm" value="confirm"></button>
      </div>
    </form>
  </dialog>
  <dialog class="confirm-dialog tester-dialog" id="tester-dialog" aria-labelledby="tester-label" aria-describedby="tester-help">
    <form id="tester-form">
      <h2 id="tester-label" data-i18n="testCommand"></h2>
      <p id="tester-help" data-i18n="testerHelp"></p>
      <div class="input-row">
        <label class="prompt-field"><span class="prompt" aria-hidden="true">$</span><input type="text" id="tester-input" class="mono" autocomplete="off" spellcheck="false" placeholder="git push --force" aria-labelledby="tester-label"></label>
        <button type="submit" class="primary" id="tester-run" data-i18n="test"></button>
      </div>
      <div id="tester-result" class="notice" aria-live="polite" hidden></div>
      <div class="dialog-actions">
        <button type="button" id="tester-close" data-i18n="close"></button>
      </div>
    </form>
  </dialog>
  <dialog class="confirm-dialog report-dialog" id="report-dialog" aria-labelledby="report-dialog-title" aria-describedby="report-dialog-body">
    <form method="dialog">
      <h2 id="report-dialog-title" data-i18n="reportDialogTitle"></h2>
      <p id="report-dialog-body" data-i18n-html="reportDialogBody"></p>
      <label class="report-field"><span data-i18n="reportWhy"></span><textarea id="report-why" data-i18n-placeholder="reportWhyPlaceholder"></textarea></label>
      <label class="report-field"><span data-i18n="reportTitleField"></span><input id="report-title" type="text" spellcheck="false"></label>
      <label class="report-field"><span data-i18n="reportCommandField"></span><textarea id="report-command" spellcheck="false"></textarea></label>
      <label class="report-field"><span data-i18n="reportEntryField"></span><textarea id="report-entry" spellcheck="false"></textarea></label>
      <div class="dialog-actions">
        <button type="submit" id="report-dialog-cancel" value="cancel" data-i18n="cancel"></button>
        <button type="submit" class="primary" id="report-dialog-open" value="report" data-i18n="openGitHubForm"></button>
      </div>
    </form>
  </dialog>
  <script>
// src/gui/frontend/gui-data.ts
var guiData = JSON.parse(document.getElementById("ccsn-data")?.textContent ?? "");

// src/gui/frontend/locales/en.ts
var count = (value) => value.toLocaleString("en");
var plural = (value, one, many) => \`\${count(value)} \${value === 1 ? one : many}\`;
var days = (value) => plural(value, "day", "days");
var en = {
  navSections: "Sections",
  navOverview: "Overview",
  navActivity: "Activity",
  navProtections: "Protections",
  navCustomRules: "Custom rules",
  navAgents: "Agents",
  navSettings: "Settings",
  navUnsaved: "Unsaved",
  documentation: "Documentation",
  loading: "Loading…",
  dismissMessage: "Dismiss message",
  cancel: "Cancel",
  close: "Close",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Copy failed",
  add: "Add",
  reset: "Reset",
  resetAll: "Reset all",
  repair: "Repair",
  save: "Save",
  discard: "Discard",
  savingStatus: "Saving…",
  saveFailed: "Save failed",
  reloadPage: "Reload the page.",
  unknownValue: "unknown",
  requestFailed: (status) => \`Request failed (status \${status}).\`,
  switchOn: "On",
  switchOff: "Off",
  stateOn: "on",
  stateOff: "off",
  stateDefault: "default",
  listSeparator: ", ",
  settingChange: (name, value) => \`\${name}: \${value}\`,
  dayUnit: (value) => value === 1 ? "day" : "days",
  dayCount: days,
  lastDays: (value) => \`last \${days(value)}\`,
  lastDaysOption: (value) => \`Last \${days(value)}\`,
  ruleCount: (value) => plural(value, "rule", "rules"),
  blockCount: (value) => plural(value, "block", "blocks"),
  pathCount: (value) => plural(value, "path", "paths"),
  justNow: "just now",
  today: "Today",
  yesterday: "Yesterday",
  overviewIntro: "What CC Safety Net has been doing on this machine.",
  needsAttention: "Needs attention",
  recentBlocks: "Recent blocks",
  allActivity: "All activity",
  topRules: "Most-triggered rules",
  statusRepair: "Your policy file needs repair",
  statusCheckingAgents: "Checking your agents…",
  statusNoAgent: "Not protecting any agent yet",
  statusPartlyProtected: "Partly protected",
  statusProtected: "Protected",
  commandProtectionIsOff: "Command protection is off",
  secretProtectionIsOff: "Secret protection is off",
  secretProtectionIsOn: "Secret protection on",
  presetFact: (preset, customized) => \`\${preset} preset\${customized ? ", customized" : ""}\`,
  commandRulesOn: (value) => \`\${count(value)} command rules on\`,
  hookActiveIn: (agents) => \`Hook active in \${agents}\`,
  agentCount: (value) => plural(value, "agent", "agents"),
  installHook: "Install a hook",
  configure: "Configure",
  review: "Review",
  fix: "Fix",
  releaseNotes: "Release notes",
  hookDisabledAttention: (agent) => \`\${agent} is detected but its hook is disabled.\`,
  suspectAttention: (blocks, window2) => \`\${plural(blocks, "block", "blocks")} in the last \${days(window2)} \${blocks === 1 ? "looks" : "look"} like a false positive.\`,
  guardErrorAttention: (errors, window2) => \`\${plural(errors, "guard error", "guard errors")} in the last \${days(window2)}: commands blocked because evaluation failed, not by policy.\`,
  updateAttention: (version) => \`Version \${version} is available.\`,
  tileBlocked: "Blocked",
  tileChecked: "Commands checked",
  perDayChart: (noun, values) => \`\${noun} per day, oldest to newest: \${values}\`,
  nothingBlocked: (window2) => \`Nothing was blocked in the last \${days(window2)}.\`,
  noCommandRecorded: "(no command recorded)",
  guardError: "guard error",
  noRuleBlocked: "No rule has blocked anything yet.",
  couldNotLoadActivity: (error) => \`Could not load activity: \${error}\`,
  starEvidence: (blocked, window2) => \`CC Safety Net has blocked <strong>\${count(blocked)}</strong> risky \${blocked === 1 ? "command" : "commands"} on this machine in the last \${days(window2)}.\`,
  starIfSaved: "If that saved your work, star the project on GitHub.",
  starIfUseful: "If CC Safety Net is useful to you, star it on GitHub.",
  starOnGitHub: "Star on GitHub",
  starButtonLabel: "Star CC Safety Net on GitHub",
  starLinkLabel: "Star CC Safety Net on GitHub (opens github.com)",
  starred: "Starred. Thank you.",
  starredLabel: "CC Safety Net starred on GitHub",
  activityIntro: "Commands your agents ran, newest first. Commands are secret-redacted when they are logged.",
  refreshActivity: "Refresh activity",
  decisionFilter: "Decision",
  searchActivity: "Search activity",
  searchActivityPlaceholder: "Search commands or rule IDs",
  agentFilter: "Agent",
  timeWindow: "Time window",
  loadingActivity: "Loading activity…",
  decisionBlocked: "Blocked",
  decisionAllowed: "Allowed",
  decisionError: "Error",
  filterErrors: "Errors",
  filterSuspect: "Likely false positive",
  filterAll: "All",
  allAgents: "All agents",
  showingBlocksOf: "Showing blocks of",
  showAllBlocks: "Show all blocks",
  noFilterMatch: "Nothing matches these filters.",
  showAllActivity: "Show all activity",
  noLogEntries: "No audit log entries match.",
  showingEntries: (shown, total, window2) => \`Showing \${count(shown)} of \${plural(total, "entry", "entries")} from the last \${days(window2)}.\`,
  activityTruncated: "Only the newest 500 entries of each decision are listed. Older entries still count toward the totals.",
  unreadableLogs: (files) => \`\${plural(files, "log file", "log files")} could not be read, so this list is incomplete.\`,
  detailFullCommand: "Full command",
  detailReason: "Reason",
  detailRule: "Rule",
  detailFolder: "Folder",
  detailTime: "Time",
  showCustomRule: "Show this custom rule",
  showProtection: "Show this protection",
  reportFalsePositive: "Report false positive",
  blockInFuture: "Block this in future",
  copyLogEntry: "Copy log entry",
  notAvailable: "Not available",
  reportTooLong: "Report too long to prefill",
  reportFieldCopied: (fields, fieldCount) => fieldCount === 1 ? \`The \${fields} was copied to your clipboard. Paste it into the form on GitHub.\` : \`The \${fields} were copied to your clipboard. Paste them into the form on GitHub.\`,
  reportFieldLeftOut: (fields, fieldCount) => \`The \${fields} \${fieldCount === 1 ? "was" : "were"} left out. Copy the log entry from Activity and paste it into the form on GitHub.\`,
  reportFieldJoiner: " and ",
  reportNameTitle: "title",
  reportNameExpected: "explanation",
  reportNameCommand: "command",
  reportNameEntry: "log entry",
  reportDialogTitle: "Report a false positive",
  reportDialogBody: "This opens a prefilled public GitHub issue form. Nothing is sent until you submit it there. Paths were replaced with <code>&lt;project&gt;</code> and <code>~</code>; edit anything else you would rather not publish.",
  reportWhy: "Why should it have been allowed? (optional)",
  reportWhyPlaceholder: "What was the agent trying to do, and what makes the command safe there?",
  reportTitleField: "Title",
  reportCommandField: "Blocked command",
  reportEntryField: "Audit log entry",
  openGitHubForm: "Open GitHub form",
  policyIntro: "Choose what CC Safety Net blocks. Changes apply after you save.",
  policyScope: "Policy you are editing",
  myPolicy: "My policy",
  projectPolicy: "Project policy",
  testCommand: "Test a command",
  editingProjectPolicy: "Editing the project policy",
  projectBarHelp: \`Only settings tagged <span class="project-chip">Project</span> are written. Everything else keeps following each person's own policy. Click a Project tag to stop setting that field.\`,
  changeFolder: "Change folder…",
  repairHelp: "Repair keeps every valid setting and rewrites the file. If the JSON cannot be read at all, defaults are restored.",
  safetyPreset: "Safety preset",
  safetyPresetSub: "Each preset includes everything in the one before it.",
  advancedSettings: "Advanced settings",
  advancedSettingsSub: "Individual checks and linked worktrees",
  searchProtections: "Search protections",
  searchProtectionsPlaceholder: "Type / to search by name, path or rule ID",
  protectionsShown: "Which protections to show",
  showChanged: "Changed from default",
  commandProtection: "Command protection",
  secretProtection: "Secret protection",
  pathsTitle: "Exceptions and extra paths",
  pathsSub: "Paths can be absolute or start with <code>~/</code>. Paste several lines to add many at once. Paths that cover your home directory are rejected.",
  allowPathsLabel: "Allow recursive deletes in",
  allowPathsHelp: "Recursive deletes inside these paths are not blocked, like a scratch folder under <code>/tmp</code>.",
  allowPathsPlaceholder: "/absolute/path or ~/path",
  denyPathsLabel: "Always block access to",
  denyPathsHelp: "These paths and everything inside them are blocked while secret protection is on.",
  denyPathsPlaceholder: "path/to/protect",
  secretAllowPathsLabel: "Paths exempt from secret patterns",
  secretAllowPathsHelp: "Files, folders, or one file name under a folder such as <code>~/code/**/.env.local</code>. Deny paths and coding agent credentials stay protected.",
  policyJson: "Policy JSON",
  rawReadOnly: "Read-only. Mirrors the settings above.",
  rawOnDisk: "The file as it is on disk.",
  rawProjectFields: (path) => \`Only the fields set by this project. Written to \${path}.\`,
  unsavedChanges: "Unsaved changes",
  unsavedChangeCount: (changes) => plural(changes, "unsaved change", "unsaved changes"),
  changeSeparator: "; ",
  moreChanges: (changes) => \`; and \${count(changes)} more\`,
  reviewAndApply: "Review and apply",
  presetStandard: "Standard",
  presetStandardDescription: "Blocks recognizable destructive commands and reading sensitive files. Recommended for normal coding.",
  presetStrict: "Strict",
  presetStrictDescription: "Also blocks commands it cannot fully parse and listing sensitive paths. Occasional false positives on advanced shell.",
  presetParanoid: "Paranoid",
  presetParanoidDescription: "Also blocks rm -rf inside your project and interpreter one-liners. Expect more false positives. Use it for untrusted agents or high-stakes repos.",
  capabilityFailClosed: "Fail closed",
  capabilityFailClosedDescription: "Block commands the parser cannot fully understand.",
  capabilityParanoidRm: "Paranoid rm -rf checks",
  capabilityParanoidRmDescription: "Block rm -rf inside the project, except temp paths.",
  capabilityParanoidInterpreters: "Paranoid interpreters",
  capabilityParanoidInterpretersDescription: "Block interpreter one-liners such as python -c.",
  presetLabel: "Preset",
  presetCustomized: (preset) => \`\${preset}, customized\`,
  fromPresetOption: (enabled) => \`From preset (\${enabled ? "on" : "off"})\`,
  fromPreset: "from preset",
  forcedOn: "forced on",
  forcedOff: "forced off",
  alwaysOn: "Always on",
  alwaysOff: "Always off",
  cannotTurnOff: "can't be turned off",
  worktreeDiscard: "Allow discarding local changes in linked git worktrees",
  worktreeDiscardHelp: "Only relaxes the discard checks inside linked worktrees.",
  worktreeChange: "Discarding changes in linked worktrees",
  allowed: "allowed",
  blocked: "blocked",
  allowPathsChange: "Allowed delete paths",
  denyPathsChange: "Always-blocked paths",
  secretAllowPathsChange: "Secret pattern exemptions",
  pathsAdded: (paths) => \`\${count(paths)} added\`,
  pathsRemoved: (paths) => \`\${count(paths)} removed\`,
  changedByYou: "Changed by you",
  forcedInAdvanced: (capability, enabled) => \`\${capability} forced \${enabled ? "on" : "off"} in Advanced\`,
  setByEnvironment: "Set by environment",
  setByEnvironmentVariable: (variable) => \`Set by environment: \${variable}\`,
  needsPreset: (preset) => \`Needs the \${preset} preset\`,
  offByDefault: "Off by default",
  offCount: (rules) => \`\${count(rules)} off\`,
  commandRuleSummary: (on, off, always) => \`\${count(on)} on · \${count(off)} off · \${count(always)} always on\`,
  commandProtectionOffSummary: "Off. Built-in rules are not enforced; catastrophic and custom rules still apply. Your rule settings are kept.",
  secretRuleSummary: (on, off) => \`\${count(on)} on · \${count(off)} off\`,
  secretProtectionOffSummary: "Off. Sensitive files and deny paths are not blocked. Your rule settings and paths are kept.",
  noCommandProtectionMatch: "No command protections match.",
  noSecretProtectionMatch: "No secret protections match.",
  aboutRule: (rule) => \`About \${rule}\`,
  protectedPaths: "Protected paths",
  protectedPathsFor: (rule) => \`Protected paths for \${rule}\`,
  toggleGroup: (group) => \`Turn all \${group} on or off\`,
  toggleAll: "Turn all on or off",
  secretCategoryBasename: "Sensitive file names",
  secretCategoryPattern: "Sensitive file name patterns",
  secretCategoryHomePath: "Sensitive home folders",
  secretCategoryVariant: "Key file name variants",
  secretCategoryExtension: "Sensitive file extensions",
  secretCategoryExtensionPattern: "Sensitive extension patterns",
  secretCategoryCredential: "Coding agent credentials",
  secretCategoryConfig: "Coding agent settings",
  inheritedChip: "Inherited",
  projectChip: "Project",
  projectChipTitle: "Set by this project. Click to stop setting it.",
  projectChipLabel: (field) => \`Set by project: \${field}. Activate to inherit again.\`,
  commandProtectionOffBanner: "Command protection is off: built-in destructive command rules are not enforced. Catastrophic and custom rules still apply.",
  secretProtectionOffBanner: "Secret protection is off: sensitive files and deny paths are not blocked.",
  fallbackConfigBanner: (reason) => \`A fallback configuration is being enforced: \${reason}\`,
  openProtections: "Open Protections",
  environmentRaises: (variables) => \`An environment variable raises protection beyond these settings: \${variables}\`,
  removePath: (path) => \`Remove \${path}\`,
  notAdded: (paths, error) => \`Not added: \${paths}. \${error}\`,
  alreadyListed: (paths) => \`Already listed: \${paths}\`,
  previewFailed: "Preview failed",
  couldNotTest: (error) => \`Could not test this command: \${error}\`,
  testerAllowed: "<strong>Allowed.</strong> No rule blocks this command.",
  createRuleToBlock: "Create a rule to block it",
  testerBlocked: (rule) => rule ? \`<strong>Blocked</strong> by \${rule}.\` : "<strong>Blocked</strong>.",
  blockedPart: "Blocked part:",
  testerHelp: "Checks a command against the Protections settings, including unsaved changes and custom rules. Nothing is run.",
  test: "Test",
  notCreatedYet: " (not created yet)",
  projectPolicyChanges: "The project policy changes these settings:",
  restoredDraft: "Restored your unsaved changes",
  couldNotLoadPolicy: "Could not load your policy",
  projectPolicyUnavailable: "Project policy unavailable",
  repairFirst: "Repair your policy first",
  repairBeforeProject: "Your own policy file must be repaired before you can edit a project policy.",
  policyNotLoaded: "Your policy has not loaded yet",
  discardUnsavedTitle: "Discard unsaved changes?",
  discardBeforeProject: "A project policy starts from your saved policy. Save your changes first, or discard them here.",
  discardChanges: "Discard changes",
  discardDraftTitle: "Discard this project draft?",
  discardDraft: "Discard draft",
  switchFolderDiscards: "Switching folders discards this draft.",
  folderPickerFailed: "Could not open the folder picker",
  projectChangesUnwritten: "Your project changes have not been written anywhere yet.",
  backToOwnPolicy: "Back to your own policy",
  discardDraftChangesTitle: "Discard changes to this draft?",
  discardDraftChangesBody: "The draft goes back to the settings this project already has.",
  changesDiscarded: "Changes discarded",
  projectDraftReloaded: "Project draft reloaded",
  projectFolderChanged: "The project folder changed",
  projectFolderChangedBody: "The draft was reloaded for the new folder. Review it again before applying.",
  invalidProjectFile: "The existing project policy file is invalid and will be replaced.",
  noEffectiveChange: "No change to the effective policy.",
  diffSetting: "Setting",
  diffNow: "Now",
  diffAfter: "After",
  unset: "(unset)",
  reviewFailed: "Review failed",
  reviewAgain: "Review again",
  draftChangedDuringReview: "The draft changed while the review was loading.",
  applyProjectTitle: "Apply this project policy?",
  applyProjectBody: "Everyone who works in this project gets these settings on top of their own policy.",
  applyProject: "Apply project policy",
  applyingStatus: "Applying…",
  applyFailed: "Apply failed",
  projectApplied: "Project policy applied",
  repairBeforeSaving: "Repair your policy before saving",
  policySaved: "Policy saved",
  discardUnsavedBody: "Every change since your last save will be undone.",
  discardingStatus: "Discarding…",
  repairTitle: "Repair your policy file?",
  repairBody: "Valid settings are kept and invalid ones are dropped. If the JSON cannot be read at all, defaults are restored.",
  repairingStatus: "Repairing…",
  repairFailed: "Repair failed",
  policyRepaired: "Policy repaired",
  nothingToReset: "Nothing to reset: every rule already uses its default",
  resetRulesTitle: "Reset every rule to its default?",
  resetRulesBody: (secret) => \`All \${secret ? "secret" : "command"} rules go back to the setting their preset gives them. You can still discard before saving.\`,
  resetRules: "Reset rules",
  turnOffSecretTitle: "Turn off secret protection?",
  turnOffCommandTitle: "Turn off command protection?",
  turnOffSecretBody: "Sensitive files, coding agent credentials, and deny paths stop being blocked until you turn this back on.",
  turnOffCommandBody: "Built-in destructive git, filesystem, and execution rules stop blocking commands until you turn this back on.",
  catastrophicStillApply: "Catastrophic and custom rules still apply.",
  turnOff: "Turn off",
  rulesIntro: "Your own blocking rules from rulebooks, enforced on top of the built-in protections.",
  refreshRules: "Refresh custom rules",
  problems: "Problems",
  problemsSub: "An error means a rulebook was skipped and none of its rules are enforced.",
  rulebooks: "Rulebooks",
  rulebooksSub: "Read-only. Rules are shown as they are enforced.",
  loadingRules: "Loading rules…",
  createRule: "Create a rule",
  createRuleSub: "Describe the rule and copy a ready-made prompt for your coding agent. CC Safety Net does not write rulebooks itself.",
  appliesTo: "Applies to",
  ruleScope: "Rule scope",
  thisProject: "This project",
  allProjects: "All projects",
  projectFolder: "Project folder",
  chooseFolder: "Choose…",
  projectFolderHint: "Where the rulebook is written. Defaults to the folder this GUI was started from.",
  ruleRequest: "What should be blocked?",
  ruleRequestPlaceholder: "Block terraform destroy in this project",
  ruleRequestHint: "Rules match a command, its subcommands, and exact arguments, not file paths or patterns.",
  tryExamples: "Try:",
  exampleSuggest: "Suggest rules",
  exampleSuggestRequest: "read my package.json and suggest blocking rules",
  exampleBlock: "Block a command",
  exampleBlockRequest: "set up rules to block all terraform destroy commands",
  exampleVerify: "Verify rules",
  exampleVerifyRequest: "verify my rules and fix any errors",
  copyPrompt: "Copy prompt",
  allRulebooksSkipped: "Every rulebook was skipped because of errors, so no custom rule is enforced. See Problems above.",
  noCustomRules: "No custom rules yet. Use <strong>Create a rule</strong> below, or run <code>npx -y cc-safety-net rule init</code>.",
  blocksWhenArgument: "Blocks when any of these arguments is present:",
  customRuleMissing: (rule) => \`\${rule} is not in any rulebook\`,
  couldNotLoadRules: (error) => \`Could not load rules: \${error}\`,
  folderPickerUnavailable: "The folder picker is not available",
  typeFolderInstead: (error) => \`\${error}. Type the project folder instead.\`,
  rulesNotLoaded: "Rules have not loaded yet",
  refreshAndRetry: "Click Refresh and try again.",
  describeRuleFirst: "Describe what should be blocked first",
  enterProjectFolder: "Enter the project folder the rule belongs to",
  promptCopied: "Prompt copied",
  pasteIntoAgent: "Paste it into your coding agent.",
  agentsIntro: "Install or remove the CC Safety Net hook for each coding agent on this machine.",
  refreshAgents: "Refresh agents",
  checkingAgents: "Checking agents…",
  hookInstalled: "Hook installed",
  hookDisabled: "Hook disabled",
  hookStatusUnknown: "Status unknown: its settings file could not be read",
  uninstalling: "Uninstalling…",
  installing: "Installing…",
  uninstall: "Uninstall",
  enable: "Enable",
  install: "Install",
  notDetected: "Not detected",
  installedAgents: "Installed",
  detectedAgents: "Detected on this machine",
  noHookYet: "No agent has the hook yet. Install it for each agent you use; until then its commands are not checked.",
  missingAgents: "Not detected on this machine",
  couldNotCheckAgents: (error) => \`Could not check agents: \${error}\`,
  installFailed: "Install failed",
  uninstallFailed: "Uninstall failed",
  settingsIntro: "Appearance, log retention, file locations, and maintenance.",
  appearance: "Appearance",
  theme: "Theme",
  themeAuto: "Auto",
  themeLight: "Light",
  themeDark: "Dark",
  preferenceHint: "Remembered on this computer.",
  language: "Language",
  preferenceSaveFailed: "Could not save this preference",
  auditLog: "Audit log",
  keepLogsFor: "Keep logs for",
  retentionNote: "Every checked command is logged. Lowering this deletes older entries, and Activity can only look back this far.",
  logFolder: "Log folder",
  copyLogFolder: "Copy the log folder path",
  files: "Files",
  policyFile: "Policy file",
  copyPolicyPath: "Copy the policy file path",
  copyProjectPolicyPath: "Copy the project policy path",
  about: "About",
  platform: "Platform",
  dangerZone: "Danger zone",
  resetPolicy: "Reset policy",
  resetPolicyHelp: "Replace your policy file with the defaults. This cannot be undone.",
  repairInProtectionsFirst: "Repair your policy file in Protections first.",
  leaveProjectDraftFirst: "Apply or leave your project policy draft first.",
  saveProtectionsFirst: "Save or discard your unsaved Protections changes first.",
  retentionRange: (min, max) => \`Enter a whole number of days from \${count(min)} to \${count(max)}.\`,
  retentionUnchanged: "Retention unchanged",
  shortenRetentionTitle: (window2) => \`Keep logs for only \${days(window2)}?\`,
  shortenRetentionBody: (window2) => \`Log entries older than \${days(window2)} are deleted on the next cleanup and cannot be recovered.\`,
  shortenRetention: "Shorten retention",
  retentionSaved: (window2) => \`Logs are now kept for \${days(window2)}\`,
  resetUnavailable: "Reset unavailable",
  resetPolicyTitle: "Reset your policy?",
  resetPolicyBody: "Your policy file is replaced with the defaults. Every customization is lost.",
  resettingStatus: "Resetting…",
  resetFailed: "Reset failed",
  policyReset: "Policy reset to the defaults"
};

// src/gui/frontend/locales/ja.ts
var count2 = (value) => value.toLocaleString("ja");
var days2 = (value) => \`\${count2(value)} 日間\`;
var ja = {
  navSections: "セクション",
  navOverview: "概要",
  navActivity: "アクティビティ",
  navProtections: "保護",
  navCustomRules: "カスタムルール",
  navAgents: "エージェント",
  navSettings: "設定",
  navUnsaved: "未保存",
  documentation: "ドキュメント",
  loading: "読み込み中…",
  dismissMessage: "メッセージを閉じる",
  cancel: "キャンセル",
  close: "閉じる",
  copy: "コピー",
  copied: "コピーしました",
  copyFailed: "コピーできませんでした",
  add: "追加",
  reset: "リセット",
  resetAll: "すべてリセット",
  repair: "修復",
  save: "保存",
  discard: "破棄",
  savingStatus: "保存中…",
  saveFailed: "保存できませんでした",
  reloadPage: "ページを再読み込みしてください。",
  unknownValue: "不明",
  requestFailed: (status) => \`リクエストに失敗しました（ステータス \${status}）。\`,
  switchOn: "オン",
  switchOff: "オフ",
  stateOn: "オン",
  stateOff: "オフ",
  stateDefault: "既定",
  listSeparator: "、",
  settingChange: (name, value) => \`\${name}：\${value}\`,
  dayUnit: () => "日",
  dayCount: days2,
  lastDays: (value) => \`過去 \${days2(value)}\`,
  lastDaysOption: (value) => \`過去 \${days2(value)}\`,
  ruleCount: (value) => \`\${count2(value)} 件のルール\`,
  blockCount: (value) => \`\${count2(value)} 件のブロック\`,
  pathCount: (value) => \`\${count2(value)} 件のパス\`,
  justNow: "たった今",
  today: "今日",
  yesterday: "昨日",
  overviewIntro: "このマシンでの CC Safety Net の動作状況です。",
  needsAttention: "要確認",
  recentBlocks: "最近のブロック",
  allActivity: "すべてのアクティビティ",
  topRules: "ブロックの多いルール",
  statusRepair: "ポリシーファイルの修復が必要です",
  statusCheckingAgents: "エージェントを確認中…",
  statusNoAgent: "まだどのエージェントも保護していません",
  statusPartlyProtected: "一部のみ保護されています",
  statusProtected: "保護されています",
  commandProtectionIsOff: "コマンド保護はオフです",
  secretProtectionIsOff: "シークレット保護はオフです",
  secretProtectionIsOn: "シークレット保護オン",
  presetFact: (preset, customized) => \`\${preset} プリセット\${customized ? "（カスタマイズ済み）" : ""}\`,
  commandRulesOn: (value) => \`コマンドルール \${count2(value)} 件がオン\`,
  hookActiveIn: (agents) => \`\${agents} でフックが有効\`,
  agentCount: (value) => \`\${count2(value)} 個のエージェント\`,
  installHook: "フックをインストール",
  configure: "設定する",
  review: "確認",
  fix: "修正",
  releaseNotes: "リリースノート",
  hookDisabledAttention: (agent) => \`\${agent} を検出しましたが、フックが無効です。\`,
  suspectAttention: (blocks, window2) => \`過去 \${days2(window2)}のブロックのうち \${count2(blocks)} 件は誤検知の可能性があります。\`,
  guardErrorAttention: (errors, window2) => \`過去 \${days2(window2)}にガードエラーが \${count2(errors)} 件ありました。ポリシーではなく、評価の失敗によってブロックされたコマンドです。\`,
  updateAttention: (version) => \`バージョン \${version} が利用可能です。\`,
  tileBlocked: "ブロック",
  tileChecked: "チェックしたコマンド",
  perDayChart: (noun, values) => \`1 日ごとの\${noun}（古い順）：\${values}\`,
  nothingBlocked: (window2) => \`過去 \${days2(window2)}にブロックされたものはありません。\`,
  noCommandRecorded: "（コマンドの記録なし）",
  guardError: "ガードエラー",
  noRuleBlocked: "まだどのルールもブロックしていません。",
  couldNotLoadActivity: (error) => \`アクティビティを読み込めませんでした：\${error}\`,
  starEvidence: (blocked, window2) => \`CC Safety Net は過去 \${days2(window2)}に、このマシンで危険なコマンドを <strong>\${count2(blocked)}</strong> 件ブロックしました。\`,
  starIfSaved: "これで作業が守られたなら、GitHub でスターをお願いします。",
  starIfUseful: "CC Safety Net が役に立ったら、GitHub でスターをお願いします。",
  starOnGitHub: "GitHub でスター",
  starButtonLabel: "GitHub で CC Safety Net にスターを付ける",
  starLinkLabel: "GitHub で CC Safety Net にスターを付ける（github.com を開きます）",
  starred: "スターを付けました。ありがとうございます。",
  starredLabel: "GitHub で CC Safety Net にスター済み",
  activityIntro: "エージェントが実行したコマンドを新しい順に表示します。コマンド内のシークレットは、ログに記録する時点でマスクします。",
  refreshActivity: "アクティビティを更新",
  decisionFilter: "判定",
  searchActivity: "アクティビティを検索",
  searchActivityPlaceholder: "コマンドまたはルール ID で検索",
  agentFilter: "エージェント",
  timeWindow: "期間",
  loadingActivity: "アクティビティを読み込み中…",
  decisionBlocked: "ブロック",
  decisionAllowed: "許可",
  decisionError: "エラー",
  filterErrors: "エラー",
  filterSuspect: "誤検知の可能性",
  filterAll: "すべて",
  allAgents: "すべてのエージェント",
  showingBlocksOf: "次のコマンドのブロックを表示中：",
  showAllBlocks: "すべてのブロックを表示",
  noFilterMatch: "この絞り込み条件に一致する項目はありません。",
  showAllActivity: "すべてのアクティビティを表示",
  noLogEntries: "一致する監査ログのエントリはありません。",
  showingEntries: (shown, total, window2) => \`過去 \${days2(window2)}の \${count2(total)} 件中 \${count2(shown)} 件を表示しています。\`,
  activityTruncated: "判定ごとに新しいほうから 500 件だけを表示します。それより古いエントリも合計には含まれます。",
  unreadableLogs: (files) => \`\${count2(files)} 件のログファイルを読み込めなかったため、この一覧は不完全です。\`,
  detailFullCommand: "コマンド全体",
  detailReason: "理由",
  detailRule: "ルール",
  detailFolder: "フォルダー",
  detailTime: "日時",
  showCustomRule: "このカスタムルールを表示",
  showProtection: "この保護を表示",
  reportFalsePositive: "誤検知を報告",
  blockInFuture: "今後はブロックする",
  copyLogEntry: "ログエントリをコピー",
  notAvailable: "利用できません",
  reportTooLong: "報告が長すぎて事前入力できません",
  reportFieldCopied: (fields) => \`\${fields}をクリップボードにコピーしました。GitHub のフォームに貼り付けてください。\`,
  reportFieldLeftOut: (fields) => \`\${fields}は含めていません。アクティビティからログエントリをコピーし、GitHub のフォームに貼り付けてください。\`,
  reportFieldJoiner: "と",
  reportNameTitle: "タイトル",
  reportNameExpected: "説明",
  reportNameCommand: "コマンド",
  reportNameEntry: "ログエントリ",
  reportDialogTitle: "誤検知を報告",
  reportDialogBody: "入力済みの公開 GitHub Issue フォームを開きます。そこで送信するまで何も送信されません。パスは <code>&lt;project&gt;</code> と <code>~</code> に置き換えてあります。それ以外に公開したくない内容があれば編集してください。",
  reportWhy: "許可されるべきだった理由（任意）",
  reportWhyPlaceholder: "エージェントは何をしようとしていて、なぜその場面ではこのコマンドが安全なのですか？",
  reportTitleField: "タイトル",
  reportCommandField: "ブロックされたコマンド",
  reportEntryField: "監査ログのエントリ",
  openGitHubForm: "GitHub のフォームを開く",
  policyIntro: "CC Safety Net がブロックする対象を選びます。変更は保存後に反映されます。",
  policyScope: "編集中のポリシー",
  myPolicy: "自分のポリシー",
  projectPolicy: "プロジェクトポリシー",
  testCommand: "コマンドをテスト",
  editingProjectPolicy: "プロジェクトポリシーを編集中",
  projectBarHelp: '<span class="project-chip">プロジェクト</span> タグの付いた設定だけが書き込まれます。それ以外の設定は引き続き各自のポリシーに従います。プロジェクトタグをクリックすると、その項目の設定を解除します。',
  changeFolder: "フォルダーを変更…",
  repairHelp: "修復すると、有効な設定をすべて残してファイルを書き直します。JSON をまったく読み取れない場合は既定値に戻します。",
  safetyPreset: "安全プリセット",
  safetyPresetSub: "各プリセットは、1 つ前のプリセットの内容をすべて含みます。",
  advancedSettings: "詳細設定",
  advancedSettingsSub: "個別のチェックとリンクされたワークツリー",
  searchProtections: "保護を検索",
  searchProtectionsPlaceholder: "/ キーで名前・パス・ルール ID を検索",
  protectionsShown: "表示する保護",
  showChanged: "既定から変更",
  commandProtection: "コマンド保護",
  secretProtection: "シークレット保護",
  pathsTitle: "例外と追加のパス",
  pathsSub: "パスは絶対パスか <code>~/</code> で始まるパスで指定します。複数行を貼り付けるとまとめて追加できます。ホームディレクトリ全体を含むパスは受け付けません。",
  allowPathsLabel: "再帰削除を許可する場所",
  allowPathsHelp: "これらのパス内での再帰削除はブロックしません。<code>/tmp</code> 以下の作業用フォルダーなどに使います。",
  allowPathsPlaceholder: "/absolute/path または ~/path",
  denyPathsLabel: "常にアクセスをブロックする場所",
  denyPathsHelp: "シークレット保護がオンの間は、これらのパスとその配下をすべてブロックします。",
  denyPathsPlaceholder: "path/to/protect",
  secretAllowPathsLabel: "シークレットパターンの対象外とするパス",
  secretAllowPathsHelp: "ファイル、フォルダー、または <code>~/code/**/.env.local</code> のようなフォルダー配下のファイル名を指定します。拒否パスとコーディングエージェントの資格情報は引き続き保護されます。",
  policyJson: "ポリシー JSON",
  rawReadOnly: "読み取り専用。上の設定を反映しています。",
  rawOnDisk: "ディスク上のファイルそのままです。",
  rawProjectFields: (path) => \`このプロジェクトが設定する項目だけです。\${path} に書き込みます。\`,
  unsavedChanges: "未保存の変更",
  unsavedChangeCount: (changes) => \`\${count2(changes)} 件の未保存の変更\`,
  changeSeparator: "／",
  moreChanges: (changes) => \`／ほか \${count2(changes)} 件\`,
  reviewAndApply: "確認して適用",
  presetStandard: "Standard",
  presetStandardDescription: "認識できる破壊的コマンドと機密ファイルの読み取りをブロックします。通常の開発におすすめです。",
  presetStrict: "Strict",
  presetStrictDescription: "完全には解析できないコマンドと機密パスの一覧表示もブロックします。高度なシェル操作でときどき誤検知があります。",
  presetParanoid: "Paranoid",
  presetParanoidDescription: "プロジェクト内の rm -rf とインタープリターの 1 行コードもブロックします。誤検知が増えるため、信頼できないエージェントや重要なリポジトリに使ってください。",
  capabilityFailClosed: "フェイルクローズ",
  capabilityFailClosedDescription: "パーサーが完全に理解できないコマンドをブロックします。",
  capabilityParanoidRm: "rm -rf の Paranoid チェック",
  capabilityParanoidRmDescription: "一時パスを除き、プロジェクト内の rm -rf をブロックします。",
  capabilityParanoidInterpreters: "インタープリターの Paranoid チェック",
  capabilityParanoidInterpretersDescription: "python -c などのインタープリターの 1 行コードをブロックします。",
  presetLabel: "安全プリセット",
  presetCustomized: (preset) => \`\${preset}（カスタマイズ済み）\`,
  fromPresetOption: (enabled) => \`プリセットに従う（\${enabled ? "オン" : "オフ"}）\`,
  fromPreset: "プリセットに従う",
  forcedOn: "常にオン",
  forcedOff: "常にオフ",
  alwaysOn: "常にオン",
  alwaysOff: "常にオフ",
  cannotTurnOff: "オフにできません",
  worktreeDiscard: "リンクされた Git ワークツリーでのローカル変更の破棄を許可",
  worktreeDiscardHelp: "リンクされたワークツリー内の破棄チェックだけを緩和します。",
  worktreeChange: "リンクされたワークツリーでの変更の破棄",
  allowed: "許可",
  blocked: "ブロック",
  allowPathsChange: "削除を許可するパス",
  denyPathsChange: "常にブロックするパス",
  secretAllowPathsChange: "シークレットパターンの対象外",
  pathsAdded: (paths) => \`\${count2(paths)} 件追加\`,
  pathsRemoved: (paths) => \`\${count2(paths)} 件削除\`,
  changedByYou: "自分で変更",
  forcedInAdvanced: (capability, enabled) => \`詳細設定で「\${capability}」を常に\${enabled ? "オン" : "オフ"}\`,
  setByEnvironment: "環境変数で設定",
  setByEnvironmentVariable: (variable) => \`環境変数で設定：\${variable}\`,
  needsPreset: (preset) => \`\${preset} プリセットが必要\`,
  offByDefault: "既定でオフ",
  offCount: (rules) => \`\${count2(rules)} 件オフ\`,
  commandRuleSummary: (on, off, always) => \`オン \${count2(on)} 件 · オフ \${count2(off)} 件 · 常にオン \${count2(always)} 件\`,
  commandProtectionOffSummary: "オフ。組み込みルールは適用されません。致命的な操作に対するルールとカスタムルールは引き続き適用されます。ルールの設定は保持されます。",
  secretRuleSummary: (on, off) => \`オン \${count2(on)} 件 · オフ \${count2(off)} 件\`,
  secretProtectionOffSummary: "オフ。機密ファイルと拒否パスはブロックされません。ルールの設定とパスは保持されます。",
  noCommandProtectionMatch: "一致するコマンド保護はありません。",
  noSecretProtectionMatch: "一致するシークレット保護はありません。",
  aboutRule: (rule) => \`\${rule} について\`,
  protectedPaths: "保護されるパス",
  protectedPathsFor: (rule) => \`\${rule} で保護されるパス\`,
  toggleGroup: (group) => \`\${group}をすべてオンまたはオフにする\`,
  toggleAll: "すべてオンまたはオフにする",
  secretCategoryBasename: "機密ファイル名",
  secretCategoryPattern: "機密ファイル名のパターン",
  secretCategoryHomePath: "ホーム内の機密フォルダー",
  secretCategoryVariant: "鍵ファイル名のバリエーション",
  secretCategoryExtension: "機密ファイルの拡張子",
  secretCategoryExtensionPattern: "機密ファイルの拡張子パターン",
  secretCategoryCredential: "コーディングエージェントの資格情報",
  secretCategoryConfig: "コーディングエージェントの設定",
  inheritedChip: "継承",
  projectChip: "プロジェクト",
  projectChipTitle: "このプロジェクトで設定中。クリックすると設定を解除します。",
  projectChipLabel: (field) => \`プロジェクトで設定中：\${field}。選択すると継承に戻ります。\`,
  commandProtectionOffBanner: "コマンド保護はオフです。組み込みの破壊的コマンドのルールは適用されません。致命的な操作に対するルールとカスタムルールは引き続き適用されます。",
  secretProtectionOffBanner: "シークレット保護はオフです。機密ファイルと拒否パスはブロックされません。",
  fallbackConfigBanner: (reason) => \`フォールバックの設定を適用しています：\${reason}\`,
  openProtections: "保護を開く",
  environmentRaises: (variables) => \`環境変数により、これらの設定以上に保護が強化されています：\${variables}\`,
  removePath: (path) => \`\${path} を削除\`,
  notAdded: (paths, error) => \`追加しませんでした：\${paths}。\${error}\`,
  alreadyListed: (paths) => \`すでに登録済み：\${paths}\`,
  previewFailed: "プレビューできませんでした",
  couldNotTest: (error) => \`このコマンドをテストできませんでした：\${error}\`,
  testerAllowed: "<strong>許可。</strong>このコマンドをブロックするルールはありません。",
  createRuleToBlock: "ブロックするルールを作成",
  testerBlocked: (rule) => rule ? \`<strong>ブロック</strong>（\${rule}）。\` : "<strong>ブロック</strong>。",
  blockedPart: "ブロックされた部分：",
  testerHelp: "未保存の変更とカスタムルールを含め、保護の設定に照らしてコマンドをチェックします。何も実行しません。",
  test: "テスト",
  notCreatedYet: "（未作成）",
  projectPolicyChanges: "プロジェクトポリシーにより、次の設定が変わります：",
  restoredDraft: "未保存の変更を復元しました",
  couldNotLoadPolicy: "ポリシーを読み込めませんでした",
  projectPolicyUnavailable: "プロジェクトポリシーを利用できません",
  repairFirst: "先にポリシーを修復してください",
  repairBeforeProject: "プロジェクトポリシーを編集する前に、自分のポリシーファイルを修復する必要があります。",
  policyNotLoaded: "ポリシーがまだ読み込まれていません",
  discardUnsavedTitle: "未保存の変更を破棄しますか？",
  discardBeforeProject: "プロジェクトポリシーは保存済みのポリシーから始まります。先に変更を保存するか、ここで破棄してください。",
  discardChanges: "変更を破棄",
  discardDraftTitle: "このプロジェクトの下書きを破棄しますか？",
  discardDraft: "下書きを破棄",
  switchFolderDiscards: "フォルダーを切り替えると、この下書きは破棄されます。",
  folderPickerFailed: "フォルダー選択を開けませんでした",
  projectChangesUnwritten: "プロジェクトの変更はまだどこにも書き込まれていません。",
  backToOwnPolicy: "自分のポリシーに戻りました",
  discardDraftChangesTitle: "この下書きへの変更を破棄しますか？",
  discardDraftChangesBody: "下書きを、このプロジェクトの現在の設定に戻します。",
  changesDiscarded: "変更を破棄しました",
  projectDraftReloaded: "プロジェクトの下書きを再読み込みしました",
  projectFolderChanged: "プロジェクトフォルダーが変わりました",
  projectFolderChangedBody: "新しいフォルダー用に下書きを再読み込みしました。適用する前にもう一度確認してください。",
  invalidProjectFile: "既存のプロジェクトポリシーファイルは無効なため、置き換えられます。",
  noEffectiveChange: "実効ポリシーに変更はありません。",
  diffSetting: "設定",
  diffNow: "現在",
  diffAfter: "適用後",
  unset: "（未設定）",
  reviewFailed: "確認できませんでした",
  reviewAgain: "もう一度確認してください",
  draftChangedDuringReview: "確認内容の読み込み中に下書きが変更されました。",
  applyProjectTitle: "このプロジェクトポリシーを適用しますか？",
  applyProjectBody: "このプロジェクトで作業する全員に、各自のポリシーに加えてこれらの設定が適用されます。",
  applyProject: "プロジェクトポリシーを適用",
  applyingStatus: "適用中…",
  applyFailed: "適用できませんでした",
  projectApplied: "プロジェクトポリシーを適用しました",
  repairBeforeSaving: "保存する前にポリシーを修復してください",
  policySaved: "ポリシーを保存しました",
  discardUnsavedBody: "最後に保存してからの変更はすべて元に戻ります。",
  discardingStatus: "破棄中…",
  repairTitle: "ポリシーファイルを修復しますか？",
  repairBody: "有効な設定は残し、無効な設定は取り除きます。JSON をまったく読み取れない場合は既定値に戻します。",
  repairingStatus: "修復中…",
  repairFailed: "修復できませんでした",
  policyRepaired: "ポリシーを修復しました",
  nothingToReset: "リセットするものはありません。すべてのルールが既定のままです",
  resetRulesTitle: "すべてのルールを既定に戻しますか？",
  resetRulesBody: (secret) => \`すべての\${secret ? "シークレット" : "コマンド"}ルールがプリセットの設定に戻ります。保存する前なら破棄できます。\`,
  resetRules: "ルールをリセット",
  turnOffSecretTitle: "シークレット保護をオフにしますか？",
  turnOffCommandTitle: "コマンド保護をオフにしますか？",
  turnOffSecretBody: "オンに戻すまで、機密ファイル、コーディングエージェントの資格情報、拒否パスはブロックされなくなります。",
  turnOffCommandBody: "オンに戻すまで、git、ファイルシステム、実行に関する組み込みの破壊的コマンドのルールはコマンドをブロックしなくなります。",
  catastrophicStillApply: "致命的な操作に対するルールとカスタムルールは引き続き適用されます。",
  turnOff: "オフにする",
  rulesIntro: "ルールブックで定義した独自のブロックルールです。組み込みの保護に加えて適用されます。",
  refreshRules: "カスタムルールを更新",
  problems: "問題",
  problemsSub: "エラーのあるルールブックはスキップされ、そのルールは 1 つも適用されません。",
  rulebooks: "ルールブック一覧",
  rulebooksSub: "読み取り専用です。実際に適用される状態でルールを表示します。",
  loadingRules: "ルールを読み込み中…",
  createRule: "ルールを作成",
  createRuleSub: "ルールを説明すると、コーディングエージェント向けのプロンプトをコピーできます。CC Safety Net 自体はルールブックを書きません。",
  appliesTo: "適用範囲",
  ruleScope: "ルールの範囲",
  thisProject: "このプロジェクト",
  allProjects: "すべてのプロジェクト",
  projectFolder: "プロジェクトフォルダー",
  chooseFolder: "選択…",
  projectFolderHint: "ルールブックの書き込み先です。既定ではこの GUI を起動したフォルダーです。",
  ruleRequest: "何をブロックしますか？",
  ruleRequestPlaceholder: "このプロジェクトで terraform destroy をブロック",
  ruleRequestHint: "ルールが照合するのは、コマンド、そのサブコマンド、完全一致の引数です。ファイルパスやパターンは照合しません。",
  tryExamples: "例：",
  exampleSuggest: "ルールを提案",
  exampleSuggestRequest: "package.json を読んで、ブロックすべきルールを提案して",
  exampleBlock: "コマンドをブロック",
  exampleBlockRequest: "terraform destroy コマンドをすべてブロックするルールを設定して",
  exampleVerify: "ルールを検証",
  exampleVerifyRequest: "ルールを検証して、エラーがあれば修正して",
  copyPrompt: "プロンプトをコピー",
  allRulebooksSkipped: "すべてのルールブックがエラーでスキップされたため、カスタムルールは適用されていません。上の「問題」を確認してください。",
  noCustomRules: "カスタムルールはまだありません。下の<strong>ルールを作成</strong>を使うか、<code>npx -y cc-safety-net rule init</code> を実行してください。",
  blocksWhenArgument: "次の引数のいずれかがあるとブロックします：",
  customRuleMissing: (rule) => \`\${rule} はどのルールブックにもありません\`,
  couldNotLoadRules: (error) => \`ルールを読み込めませんでした：\${error}\`,
  folderPickerUnavailable: "フォルダー選択を利用できません",
  typeFolderInstead: (error) => \`\${error}。代わりにプロジェクトフォルダーを入力してください。\`,
  rulesNotLoaded: "ルールがまだ読み込まれていません",
  refreshAndRetry: "更新してからもう一度お試しください。",
  describeRuleFirst: "先にブロックする内容を説明してください",
  enterProjectFolder: "ルールを置くプロジェクトフォルダーを入力してください",
  promptCopied: "プロンプトをコピーしました",
  pasteIntoAgent: "コーディングエージェントに貼り付けてください。",
  agentsIntro: "このマシンの各コーディングエージェントに、CC Safety Net のフックをインストールまたは削除します。",
  refreshAgents: "エージェントを更新",
  checkingAgents: "エージェントを確認中…",
  hookInstalled: "フックをインストール済み",
  hookDisabled: "フック無効",
  hookStatusUnknown: "状態不明。設定ファイルを読み取れませんでした",
  uninstalling: "アンインストール中…",
  installing: "インストール中…",
  uninstall: "アンインストール",
  enable: "有効にする",
  install: "インストール",
  notDetected: "未検出",
  installedAgents: "インストール済み",
  detectedAgents: "このマシンで検出",
  noHookYet: "まだどのエージェントにもフックがありません。使うエージェントごとにインストールしてください。インストールするまで、そのエージェントのコマンドはチェックされません。",
  missingAgents: "このマシンで未検出",
  couldNotCheckAgents: (error) => \`エージェントを確認できませんでした：\${error}\`,
  installFailed: "インストールできませんでした",
  uninstallFailed: "アンインストールできませんでした",
  settingsIntro: "外観、ログの保持期間、ファイルの場所、メンテナンス。",
  appearance: "外観",
  theme: "テーマ",
  themeAuto: "自動",
  themeLight: "ライト",
  themeDark: "ダーク",
  preferenceHint: "このコンピューターに保存されます。",
  language: "言語",
  preferenceSaveFailed: "この設定を保存できませんでした",
  auditLog: "監査ログ",
  keepLogsFor: "ログの保持期間",
  retentionNote: "チェックしたコマンドはすべて記録されます。短くすると古いエントリが削除され、アクティビティもこの期間までしか遡れません。",
  logFolder: "ログフォルダー",
  copyLogFolder: "ログフォルダーのパスをコピー",
  files: "ファイル",
  policyFile: "ポリシーファイル",
  copyPolicyPath: "ポリシーファイルのパスをコピー",
  copyProjectPolicyPath: "プロジェクトポリシーのパスをコピー",
  about: "このアプリについて",
  platform: "プラットフォーム",
  dangerZone: "危険な操作",
  resetPolicy: "ポリシーをリセット",
  resetPolicyHelp: "ポリシーファイルを既定値に置き換えます。元に戻せません。",
  repairInProtectionsFirst: "先に「保護」でポリシーファイルを修復してください。",
  leaveProjectDraftFirst: "先にプロジェクトポリシーの下書きを適用するか、終了してください。",
  saveProtectionsFirst: "先に「保護」の未保存の変更を保存するか、破棄してください。",
  retentionRange: (min, max) => \`\${count2(min)}〜\${count2(max)} の整数で日数を入力してください。\`,
  retentionUnchanged: "保持期間は変更されていません",
  shortenRetentionTitle: (window2) => \`ログの保持期間を \${days2(window2)}に短縮しますか？\`,
  shortenRetentionBody: (window2) => \`\${days2(window2)}より古いログエントリは次回のクリーンアップで削除され、復元できません。\`,
  shortenRetention: "保持期間を短縮",
  retentionSaved: (window2) => \`ログの保持期間を \${days2(window2)}にしました\`,
  resetUnavailable: "リセットできません",
  resetPolicyTitle: "ポリシーをリセットしますか？",
  resetPolicyBody: "ポリシーファイルが既定値に置き換わり、カスタマイズはすべて失われます。",
  resettingStatus: "リセット中…",
  resetFailed: "リセットできませんでした",
  policyReset: "ポリシーを既定値にリセットしました"
};

// src/gui/frontend/locales/zh-CN.ts
var count3 = (value) => value.toLocaleString("zh-CN");
var days3 = (value) => \`\${count3(value)} 天\`;
var zhCN = {
  navSections: "视图",
  navOverview: "概览",
  navActivity: "活动",
  navProtections: "保护",
  navCustomRules: "自定义规则",
  navAgents: "智能体",
  navSettings: "设置",
  navUnsaved: "未保存",
  documentation: "文档",
  loading: "加载中…",
  dismissMessage: "关闭消息",
  cancel: "取消",
  close: "关闭",
  copy: "复制",
  copied: "已复制",
  copyFailed: "复制失败",
  add: "添加",
  reset: "重置",
  resetAll: "全部重置",
  repair: "修复",
  save: "保存",
  discard: "丢弃",
  savingStatus: "保存中…",
  saveFailed: "保存失败",
  reloadPage: "请重新加载页面。",
  unknownValue: "未知",
  requestFailed: (status) => \`请求失败（状态码 \${status}）。\`,
  switchOn: "开",
  switchOff: "关",
  stateOn: "开启",
  stateOff: "关闭",
  stateDefault: "默认",
  listSeparator: "、",
  settingChange: (name, value) => \`\${name}：\${value}\`,
  dayUnit: () => "天",
  dayCount: days3,
  lastDays: (value) => \`最近 \${days3(value)}\`,
  lastDaysOption: (value) => \`最近 \${days3(value)}\`,
  ruleCount: (value) => \`\${count3(value)} 条规则\`,
  blockCount: (value) => \`\${count3(value)} 次阻止\`,
  pathCount: (value) => \`\${count3(value)} 个路径\`,
  justNow: "刚刚",
  today: "今天",
  yesterday: "昨天",
  overviewIntro: "CC Safety Net 在本机上的运行情况。",
  needsAttention: "需要处理",
  recentBlocks: "最近阻止",
  allActivity: "全部活动",
  topRules: "触发最多的规则",
  statusRepair: "策略文件需要修复",
  statusCheckingAgents: "正在检查智能体…",
  statusNoAgent: "尚未保护任何智能体",
  statusPartlyProtected: "部分受保护",
  statusProtected: "已受保护",
  commandProtectionIsOff: "命令保护已关闭",
  secretProtectionIsOff: "机密保护已关闭",
  secretProtectionIsOn: "机密保护已开启",
  presetFact: (preset, customized) => \`\${preset} 预设\${customized ? "（已自定义）" : ""}\`,
  commandRulesOn: (value) => \`已开启 \${count3(value)} 条命令规则\`,
  hookActiveIn: (agents) => \`已在 \${agents} 中启用 hook\`,
  agentCount: (value) => \`\${count3(value)} 个智能体\`,
  installHook: "安装 hook",
  configure: "配置",
  review: "查看",
  fix: "修复",
  releaseNotes: "发布说明",
  hookDisabledAttention: (agent) => \`已检测到 \${agent}，但其 hook 已禁用。\`,
  suspectAttention: (blocks, window2) => \`最近 \${days3(window2)}内有 \${count3(blocks)} 次阻止疑似误报。\`,
  guardErrorAttention: (errors, window2) => \`最近 \${days3(window2)}内有 \${count3(errors)} 个防护错误。这些命令因评估失败被阻止，不是被策略阻止。\`,
  updateAttention: (version) => \`\${version} 版本已发布。\`,
  tileBlocked: "已阻止",
  tileChecked: "已检查命令",
  perDayChart: (noun, values) => \`\${noun}（每日，从旧到新）：\${values}\`,
  nothingBlocked: (window2) => \`最近 \${days3(window2)}内没有阻止记录。\`,
  noCommandRecorded: "（未记录命令）",
  guardError: "防护错误",
  noRuleBlocked: "还没有规则触发过阻止。",
  couldNotLoadActivity: (error) => \`无法加载活动：\${error}\`,
  starEvidence: (blocked, window2) => \`最近 \${days3(window2)}内，CC Safety Net 在本机上阻止了 <strong>\${count3(blocked)}</strong> 条危险命令。\`,
  starIfSaved: "如果这帮你保住了工作，欢迎在 GitHub 上为项目加星。",
  starIfUseful: "如果 CC Safety Net 对你有用，欢迎在 GitHub 上加星。",
  starOnGitHub: "在 GitHub 上加星",
  starButtonLabel: "在 GitHub 上为 CC Safety Net 加星",
  starLinkLabel: "在 GitHub 上为 CC Safety Net 加星（打开 github.com）",
  starred: "已加星，谢谢。",
  starredLabel: "已在 GitHub 上为 CC Safety Net 加星",
  activityIntro: "智能体运行过的命令，最新的在前。命令写入日志前会做机密脱敏。",
  refreshActivity: "刷新活动",
  decisionFilter: "判定",
  searchActivity: "搜索活动",
  searchActivityPlaceholder: "搜索命令或规则 ID",
  agentFilter: "智能体",
  timeWindow: "时间窗口",
  loadingActivity: "正在加载活动…",
  decisionBlocked: "已阻止",
  decisionAllowed: "已允许",
  decisionError: "错误",
  filterErrors: "错误",
  filterSuspect: "疑似误报",
  filterAll: "全部",
  allAgents: "全部智能体",
  showingBlocksOf: "只显示此命令的阻止记录：",
  showAllBlocks: "显示全部阻止记录",
  noFilterMatch: "没有符合过滤条件的记录。",
  showAllActivity: "显示全部活动",
  noLogEntries: "没有匹配的审计日志条目。",
  showingEntries: (shown, total, window2) => \`显示最近 \${days3(window2)}内 \${count3(total)} 个条目中的 \${count3(shown)} 个。\`,
  activityTruncated: "每种判定只列出最新的 500 个条目。更早的条目仍计入总数。",
  unreadableLogs: (files) => \`有 \${count3(files)} 个日志文件无法读取，此列表不完整。\`,
  detailFullCommand: "完整命令",
  detailReason: "原因",
  detailRule: "规则",
  detailFolder: "目录",
  detailTime: "时间",
  showCustomRule: "查看此自定义规则",
  showProtection: "查看此项保护",
  reportFalsePositive: "报告误报",
  blockInFuture: "以后阻止此命令",
  copyLogEntry: "复制日志条目",
  notAvailable: "不可用",
  reportTooLong: "报告过长，无法预填",
  reportFieldCopied: (fields) => \`\${fields}已复制到剪贴板。请粘贴到 GitHub 上的表单中。\`,
  reportFieldLeftOut: (fields) => \`\${fields}已省略。请在活动视图中复制日志条目，粘贴到 GitHub 上的表单中。\`,
  reportFieldJoiner: "和",
  reportNameTitle: "标题",
  reportNameExpected: "说明",
  reportNameCommand: "命令",
  reportNameEntry: "日志条目",
  reportDialogTitle: "报告误报",
  reportDialogBody: "这会打开一个预填好的公开 GitHub issue 表单。在那里提交之前，不会发送任何内容。路径已替换为 <code>&lt;project&gt;</code> 和 <code>~</code>。其他不想公开的内容请自行修改。",
  reportWhy: "为什么应该允许？（可选）",
  reportWhyPlaceholder: "智能体当时想做什么？为什么这条命令在那里是安全的？",
  reportTitleField: "标题",
  reportCommandField: "被阻止的命令",
  reportEntryField: "审计日志条目",
  openGitHubForm: "打开 GitHub 表单",
  policyIntro: "选择 CC Safety Net 要阻止的内容。保存后生效。",
  policyScope: "正在编辑的策略",
  myPolicy: "我的策略",
  projectPolicy: "项目策略",
  testCommand: "测试命令",
  editingProjectPolicy: "正在编辑项目策略",
  projectBarHelp: '只写入标记为 <span class="project-chip">项目</span> 的设置。其余设置仍遵循每个人自己的策略。点击“项目”标记可取消设置该字段。',
  changeFolder: "更改目录…",
  repairHelp: "修复会保留所有有效设置并重写文件。如果 JSON 完全无法读取，则恢复默认值。",
  safetyPreset: "安全预设",
  safetyPresetSub: "每个预设都包含前一个预设的全部内容。",
  advancedSettings: "高级设置",
  advancedSettingsSub: "单项检查和 linked worktree",
  searchProtections: "搜索保护",
  searchProtectionsPlaceholder: "按 / 搜索名称、路径或规则 ID",
  protectionsShown: "要显示的保护",
  showChanged: "与默认值不同",
  commandProtection: "命令保护",
  secretProtection: "机密保护",
  pathsTitle: "例外和额外路径",
  pathsSub: "路径可以是绝对路径，也可以以 <code>~/</code> 开头。粘贴多行可一次添加多个。覆盖主目录的路径会被拒绝。",
  allowPathsLabel: "允许递归删除的路径",
  allowPathsHelp: "这些路径内的递归删除不会被阻止，例如 <code>/tmp</code> 下的临时目录。",
  allowPathsPlaceholder: "/absolute/path 或 ~/path",
  denyPathsLabel: "始终阻止访问的路径",
  denyPathsHelp: "机密保护开启时，这些路径及其下的所有内容都会被阻止。",
  denyPathsPlaceholder: "path/to/protect",
  secretAllowPathsLabel: "不受机密模式约束的路径",
  secretAllowPathsHelp: "文件、目录，或某个目录下的单个文件名，例如 <code>~/code/**/.env.local</code>。拒绝路径和编码智能体凭证的保护仍然生效。",
  policyJson: "策略 JSON",
  rawReadOnly: "只读，与上方设置保持一致。",
  rawOnDisk: "磁盘上的原始文件内容。",
  rawProjectFields: (path) => \`只包含此项目设置的字段，写入 \${path}。\`,
  unsavedChanges: "未保存的更改",
  unsavedChangeCount: (changes) => \`\${count3(changes)} 项未保存的更改\`,
  changeSeparator: "；",
  moreChanges: (changes) => \`；另有 \${count3(changes)} 项\`,
  reviewAndApply: "复核并应用",
  presetStandard: "Standard",
  presetStandardDescription: "阻止可识别的破坏性命令和对敏感文件的读取。推荐日常开发使用。",
  presetStrict: "Strict",
  presetStrictDescription: "还会阻止无法完全解析的命令和列出敏感路径的操作。复杂的 shell 写法偶尔会误报。",
  presetParanoid: "Paranoid",
  presetParanoidDescription: "还会阻止项目内的 rm -rf 和解释器单行命令。误报会更多，适合不受信任的智能体或高风险仓库。",
  capabilityFailClosed: "Fail closed",
  capabilityFailClosedDescription: "阻止解析器无法完全理解的命令。",
  capabilityParanoidRm: "Paranoid rm -rf 检查",
  capabilityParanoidRmDescription: "阻止项目内的 rm -rf，临时路径除外。",
  capabilityParanoidInterpreters: "Paranoid 解释器检查",
  capabilityParanoidInterpretersDescription: "阻止 python -c 等解释器单行命令。",
  presetLabel: "预设",
  presetCustomized: (preset) => \`\${preset}（已自定义）\`,
  fromPresetOption: (enabled) => \`跟随预设（\${enabled ? "开启" : "关闭"}）\`,
  fromPreset: "跟随预设",
  forcedOn: "强制开启",
  forcedOff: "强制关闭",
  alwaysOn: "始终开启",
  alwaysOff: "始终关闭",
  cannotTurnOff: "无法关闭",
  worktreeDiscard: "允许在 git linked worktree 中丢弃本地更改",
  worktreeDiscardHelp: "只放宽 linked worktree 内的丢弃检查。",
  worktreeChange: "在 linked worktree 中丢弃更改",
  allowed: "允许",
  blocked: "阻止",
  allowPathsChange: "允许删除的路径",
  denyPathsChange: "始终阻止的路径",
  secretAllowPathsChange: "机密模式豁免",
  pathsAdded: (paths) => \`添加 \${count3(paths)} 个\`,
  pathsRemoved: (paths) => \`移除 \${count3(paths)} 个\`,
  changedByYou: "由你更改",
  forcedInAdvanced: (capability, enabled) => \`\${capability} 已在高级设置中强制\${enabled ? "开启" : "关闭"}\`,
  setByEnvironment: "由环境变量设置",
  setByEnvironmentVariable: (variable) => \`由环境变量设置：\${variable}\`,
  needsPreset: (preset) => \`需要 \${preset} 预设\`,
  offByDefault: "默认关闭",
  offCount: (rules) => \`\${count3(rules)} 条已关闭\`,
  commandRuleSummary: (on, off, always) => \`开启 \${count3(on)} 条 · 关闭 \${count3(off)} 条 · 始终开启 \${count3(always)} 条\`,
  commandProtectionOffSummary: "已关闭。内置规则不再生效，灾难性规则和自定义规则仍然生效。规则设置会保留。",
  secretRuleSummary: (on, off) => \`开启 \${count3(on)} 条 · 关闭 \${count3(off)} 条\`,
  secretProtectionOffSummary: "已关闭。不再阻止敏感文件和拒绝路径。规则设置和路径会保留。",
  noCommandProtectionMatch: "没有匹配的命令保护规则。",
  noSecretProtectionMatch: "没有匹配的机密保护规则。",
  aboutRule: (rule) => \`关于 \${rule}\`,
  protectedPaths: "受保护的路径",
  protectedPathsFor: (rule) => \`\${rule} 保护的路径\`,
  toggleGroup: (group) => \`开启或关闭“\${group}”中的全部规则\`,
  toggleAll: "全部开启或关闭",
  secretCategoryBasename: "敏感文件名",
  secretCategoryPattern: "敏感文件名模式",
  secretCategoryHomePath: "主目录中的敏感目录",
  secretCategoryVariant: "密钥文件名变体",
  secretCategoryExtension: "敏感文件扩展名",
  secretCategoryExtensionPattern: "敏感扩展名模式",
  secretCategoryCredential: "编码智能体凭证",
  secretCategoryConfig: "编码智能体设置",
  inheritedChip: "继承",
  projectChip: "项目",
  projectChipTitle: "由此项目设置。点击可取消设置。",
  projectChipLabel: (field) => \`由项目设置：\${field}。激活后恢复继承。\`,
  commandProtectionOffBanner: "命令保护已关闭，内置的破坏性命令规则不再生效。灾难性规则和自定义规则仍然生效。",
  secretProtectionOffBanner: "机密保护已关闭，不再阻止敏感文件和拒绝路径。",
  fallbackConfigBanner: (reason) => \`正在执行 fallback 配置：\${reason}\`,
  openProtections: "打开保护视图",
  environmentRaises: (variables) => \`环境变量把保护强度提高到了这些设置之上：\${variables}\`,
  removePath: (path) => \`移除 \${path}\`,
  notAdded: (paths, error) => \`未添加：\${paths}。\${error}\`,
  alreadyListed: (paths) => \`已在列表中：\${paths}\`,
  previewFailed: "预览失败",
  couldNotTest: (error) => \`无法测试此命令：\${error}\`,
  testerAllowed: "<strong>允许。</strong>没有规则阻止此命令。",
  createRuleToBlock: "创建规则阻止它",
  testerBlocked: (rule) => rule ? \`<strong>已阻止</strong>，触发规则 \${rule}。\` : "<strong>已阻止</strong>。",
  blockedPart: "被阻止的部分：",
  testerHelp: "按保护设置检查命令，包括未保存的更改和自定义规则。不会实际运行。",
  test: "测试",
  notCreatedYet: "（尚未创建）",
  projectPolicyChanges: "项目策略会更改以下设置：",
  restoredDraft: "已恢复未保存的更改",
  couldNotLoadPolicy: "无法加载策略",
  projectPolicyUnavailable: "项目策略不可用",
  repairFirst: "请先修复你的策略",
  repairBeforeProject: "编辑项目策略前，必须先修复你自己的策略文件。",
  policyNotLoaded: "策略尚未加载",
  discardUnsavedTitle: "丢弃未保存的更改？",
  discardBeforeProject: "项目策略以你已保存的策略为起点。请先保存更改，或在此丢弃。",
  discardChanges: "丢弃更改",
  discardDraftTitle: "丢弃此项目草稿？",
  discardDraft: "丢弃草稿",
  switchFolderDiscards: "切换目录会丢弃此草稿。",
  folderPickerFailed: "无法打开目录选择器",
  projectChangesUnwritten: "项目更改尚未写入任何文件。",
  backToOwnPolicy: "已返回你自己的策略",
  discardDraftChangesTitle: "丢弃对此草稿的更改？",
  discardDraftChangesBody: "草稿将恢复为此项目现有的设置。",
  changesDiscarded: "已丢弃更改",
  projectDraftReloaded: "已重新加载项目草稿",
  projectFolderChanged: "项目目录已更改",
  projectFolderChangedBody: "已按新目录重新加载草稿。应用前请再次复核。",
  invalidProjectFile: "现有的项目策略文件无效，将被替换。",
  noEffectiveChange: "生效策略没有变化。",
  diffSetting: "设置",
  diffNow: "当前",
  diffAfter: "应用后",
  unset: "（未设置）",
  reviewFailed: "复核失败",
  reviewAgain: "重新复核",
  draftChangedDuringReview: "复核结果加载期间，草稿发生了变化。",
  applyProjectTitle: "应用此项目策略？",
  applyProjectBody: "此项目中的每个人都会在自己策略的基础上叠加这些设置。",
  applyProject: "应用项目策略",
  applyingStatus: "应用中…",
  applyFailed: "应用失败",
  projectApplied: "已应用项目策略",
  repairBeforeSaving: "请先修复策略再保存",
  policySaved: "策略已保存",
  discardUnsavedBody: "自上次保存以来的所有更改都将撤销。",
  discardingStatus: "丢弃中…",
  repairTitle: "修复策略文件？",
  repairBody: "保留有效设置，丢弃无效设置。如果 JSON 完全无法读取，则恢复默认值。",
  repairingStatus: "修复中…",
  repairFailed: "修复失败",
  policyRepaired: "策略已修复",
  nothingToReset: "无需重置，所有规则都已使用默认值",
  resetRulesTitle: "将所有规则重置为默认值？",
  resetRulesBody: (secret) => \`所有\${secret ? "机密" : "命令"}规则都将恢复为预设给出的设置。保存前仍可丢弃。\`,
  resetRules: "重置规则",
  turnOffSecretTitle: "关闭机密保护？",
  turnOffCommandTitle: "关闭命令保护？",
  turnOffSecretBody: "在重新开启之前，不再阻止敏感文件、编码智能体凭证和拒绝路径。",
  turnOffCommandBody: "在重新开启之前，内置的破坏性 git、文件系统和执行规则不再阻止命令。",
  catastrophicStillApply: "灾难性规则和自定义规则仍然生效。",
  turnOff: "关闭",
  rulesIntro: "你在 rulebook 中编写的阻止规则，在内置保护之外额外执行。",
  refreshRules: "刷新自定义规则",
  problems: "问题",
  problemsSub: "出现错误表示该 rulebook 已被跳过，其中的规则都不会执行。",
  rulebooks: "Rulebook",
  rulebooksSub: "只读。按实际执行的方式显示规则。",
  loadingRules: "正在加载规则…",
  createRule: "创建规则",
  createRuleSub: "描述规则，然后复制一段现成的 prompt 交给编码智能体。CC Safety Net 本身不会写入 rulebook。",
  appliesTo: "适用范围",
  ruleScope: "规则范围",
  thisProject: "此项目",
  allProjects: "所有项目",
  projectFolder: "项目目录",
  chooseFolder: "选择…",
  projectFolderHint: "rulebook 的写入位置。默认为启动此 GUI 的目录。",
  ruleRequest: "要阻止什么？",
  ruleRequestPlaceholder: "在此项目中阻止 terraform destroy",
  ruleRequestHint: "规则匹配命令、子命令和精确参数，不匹配文件路径或模式。",
  tryExamples: "试试：",
  exampleSuggest: "推荐规则",
  exampleSuggestRequest: "阅读我的 package.json，推荐要阻止的规则",
  exampleBlock: "阻止命令",
  exampleBlockRequest: "设置规则，阻止所有 terraform destroy 命令",
  exampleVerify: "验证规则",
  exampleVerifyRequest: "验证我的规则并修复所有错误",
  copyPrompt: "复制 prompt",
  allRulebooksSkipped: "所有 rulebook 都因错误被跳过，没有任何自定义规则生效。请查看上方的“问题”。",
  noCustomRules: "还没有自定义规则。使用下方的<strong>创建规则</strong>，或运行 <code>npx -y cc-safety-net rule init</code>。",
  blocksWhenArgument: "出现以下任一参数时阻止：",
  customRuleMissing: (rule) => \`\${rule} 不在任何 rulebook 中\`,
  couldNotLoadRules: (error) => \`无法加载规则：\${error}\`,
  folderPickerUnavailable: "目录选择器不可用",
  typeFolderInstead: (error) => \`\${error}。请手动输入项目目录。\`,
  rulesNotLoaded: "规则尚未加载",
  refreshAndRetry: "请点击刷新后重试。",
  describeRuleFirst: "请先描述要阻止的内容",
  enterProjectFolder: "请输入规则所属的项目目录",
  promptCopied: "已复制 prompt",
  pasteIntoAgent: "请将其粘贴到编码智能体中。",
  agentsIntro: "为本机上的每个编码智能体安装或卸载 CC Safety Net hook。",
  refreshAgents: "刷新智能体",
  checkingAgents: "正在检查智能体…",
  hookInstalled: "已安装 hook",
  hookDisabled: "已禁用 hook",
  hookStatusUnknown: "状态未知，无法读取其设置文件",
  uninstalling: "正在卸载…",
  installing: "正在安装…",
  uninstall: "卸载",
  enable: "启用",
  install: "安装",
  notDetected: "未检测到",
  installedAgents: "已安装",
  detectedAgents: "本机已检测到",
  noHookYet: "还没有智能体安装 hook。请为你使用的每个智能体安装。未安装的智能体，其命令不会受到检查。",
  missingAgents: "本机未检测到",
  couldNotCheckAgents: (error) => \`无法检查智能体：\${error}\`,
  installFailed: "安装失败",
  uninstallFailed: "卸载失败",
  settingsIntro: "外观、日志保留、文件位置和维护。",
  appearance: "外观",
  theme: "主题",
  themeAuto: "自动",
  themeLight: "浅色",
  themeDark: "深色",
  preferenceHint: "保存在本机。",
  language: "语言",
  preferenceSaveFailed: "无法保存此偏好设置",
  auditLog: "审计日志",
  keepLogsFor: "日志保留期",
  retentionNote: "每条检查过的命令都会记入日志。缩短保留期会删除较早的条目，活动视图也只能回溯到这个范围。",
  logFolder: "日志目录",
  copyLogFolder: "复制日志目录路径",
  files: "文件",
  policyFile: "策略文件",
  copyPolicyPath: "复制策略文件路径",
  copyProjectPolicyPath: "复制项目策略路径",
  about: "关于",
  platform: "平台",
  dangerZone: "危险操作",
  resetPolicy: "重置策略",
  resetPolicyHelp: "用默认值替换策略文件。此操作无法撤销。",
  repairInProtectionsFirst: "请先在保护视图中修复策略文件。",
  leaveProjectDraftFirst: "请先应用或退出项目策略草稿。",
  saveProtectionsFirst: "请先保存或丢弃保护视图中未保存的更改。",
  retentionRange: (min, max) => \`请输入 \${count3(min)} 到 \${count3(max)} 之间的整数天数。\`,
  retentionUnchanged: "保留期未更改",
  shortenRetentionTitle: (window2) => \`日志只保留 \${days3(window2)}？\`,
  shortenRetentionBody: (window2) => \`早于 \${days3(window2)}的日志条目将在下次清理时删除，且无法恢复。\`,
  shortenRetention: "缩短保留期",
  retentionSaved: (window2) => \`日志保留期已改为 \${days3(window2)}\`,
  resetUnavailable: "无法重置",
  resetPolicyTitle: "重置策略？",
  resetPolicyBody: "策略文件将替换为默认值，所有自定义设置都会丢失。",
  resettingStatus: "重置中…",
  resetFailed: "重置失败",
  policyReset: "策略已重置为默认值"
};

// src/gui/frontend/preferences.ts
var locales = ["en", "ja", "zh-CN"];
var localeByLanguage = new Map([
  ["en", "en"],
  ["ja", "ja"],
  ["zh", "zh-CN"]
]);
var resolveLocale = (saved, languages) => saved ?? languages.map((tag) => localeByLanguage.get(tag.toLowerCase().split("-")[0] ?? "")).find((locale) => locale !== undefined) ?? "en";

// src/gui/frontend/i18n.ts
var locale = resolveLocale(guiData.preferences.language, navigator.languages);
var t = { en, ja, "zh-CN": zhCN }[locale];
var formatCount = (value) => value.toLocaleString(locale);
var formatDateTime = (ts) => new Date(ts).toLocaleString(locale);
var formatClockTime = (ts) => new Date(ts).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
var relativeTimeFormat = new Intl.RelativeTimeFormat(locale, {
  numeric: "always",
  style: "narrow"
});
var formatRelativeTime = (ts) => {
  const minutes = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (!Number.isFinite(minutes))
    return "";
  if (minutes >= 1440)
    return relativeTimeFormat.format(-Math.floor(minutes / 1440), "day");
  if (minutes >= 60)
    return relativeTimeFormat.format(-Math.floor(minutes / 60), "hour");
  if (minutes >= 1)
    return relativeTimeFormat.format(-minutes, "minute");
  return t.justNow;
};
var formatDayHeading = (ts) => {
  const date = new Date(ts).toDateString();
  if (date === new Date().toDateString())
    return t.today;
  if (date === new Date(Date.now() - 86400000).toDateString())
    return t.yesterday;
  return new Date(ts).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

// src/hosts/catalog.ts
var DEEPSEEK_HARNESS_NPM_PROBE = [
  "npx",
  "--offline",
  "--no-install",
  "@deepseek-ai/dsh",
  "--version"
];
var catalog = [
  {
    id: "antigravity-cli",
    displayName: "Antigravity CLI",
    runtime: {
      flags: ["-ac", "--agy-cli"],
      description: "Run as Antigravity CLI PreToolUse hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--agy-cli",
      artifactKind: "hook config",
      probeCommand: ["agy", "--version"]
    }
  },
  {
    id: "claude-code",
    displayName: "Claude Code",
    runtime: {
      displayName: "Coding CLI",
      flags: ["-cc", "--coding-cli"],
      legacyFlags: ["--claude-code"],
      description: "Run as Coding CLI PreToolUse hook",
      legacyTopLevelFlags: ["-cc", "--claude-code"]
    },
    install: {
      flag: "--claude-code",
      artifactKind: "plugin",
      probeCommand: ["claude", "--version"]
    }
  },
  {
    id: "codex",
    displayName: "Codex",
    runtime: {
      flags: ["-cx", "--codex"],
      description: "Run as a Codex PreToolUse hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--codex",
      artifactKind: "plugin",
      probeCommand: ["codex", "--version"]
    }
  },
  {
    id: "copilot-cli",
    displayName: "GitHub Copilot CLI",
    runtime: {
      flags: ["-cp", "--copilot-cli"],
      description: "Run as GitHub Copilot CLI PreToolUse hook",
      legacyTopLevelFlags: ["-cp", "--copilot-cli"]
    },
    install: {
      flag: "--copilot-cli",
      artifactKind: "plugin",
      probeCommand: ["copilot", "--binary-version"]
    }
  },
  {
    id: "gemini-cli",
    displayName: "Gemini CLI",
    runtime: {
      flags: ["-gc", "--gemini-cli"],
      description: "Run as Gemini CLI BeforeTool hook",
      legacyTopLevelFlags: ["-gc", "--gemini-cli"]
    },
    install: {
      flag: "--gemini-cli",
      artifactKind: "extension",
      probeCommand: ["gemini", "--version"]
    }
  },
  {
    id: "grok-build",
    displayName: "Grok Build",
    runtime: {
      flags: ["-gb", "--grok-build"],
      description: "Run as Grok Build PreToolUse hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--grok-build",
      artifactKind: "hook config",
      probeCommand: ["grok", "--version"]
    }
  },
  {
    id: "hermes-agent",
    displayName: "Hermes Agent",
    runtime: {
      flags: ["-ha", "--hermes-agent"],
      description: "Run as Hermes Agent pre_tool_call hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--hermes-agent",
      artifactKind: "plugin",
      probeCommand: ["hermes", "--version"]
    }
  },
  {
    id: "kimi-code",
    displayName: "Kimi Code",
    runtime: {
      flags: ["-kc", "--kimi-code"],
      description: "Run as Kimi Code PreToolUse hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--kimi-code",
      artifactKind: "hook config",
      probeCommand: ["kimi", "--version"]
    }
  },
  {
    id: "openclaw",
    displayName: "OpenClaw",
    install: {
      flag: "--openclaw",
      artifactKind: "plugin",
      probeCommand: ["openclaw", "--version"]
    }
  },
  {
    id: "opencode",
    displayName: "OpenCode",
    install: {
      flag: "--opencode",
      artifactKind: "plugin",
      probeCommand: ["opencode", "--version"]
    }
  },
  {
    id: "pi",
    displayName: "Pi",
    install: {
      flag: "--pi",
      artifactKind: "package",
      probeCommand: ["pi", "--version"]
    }
  },
  {
    id: "cursor",
    displayName: "Cursor",
    runtime: {
      flags: ["-cu", "--cursor"],
      description: "Run as Cursor preToolUse hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--cursor",
      artifactKind: "hook config",
      probeCommand: ["cursor", "--version"]
    }
  },
  {
    id: "deepseek-harness",
    displayName: "DeepSeek Harness",
    install: {
      flag: "--deepseek-harness",
      artifactKind: "package",
      probeCommand: DEEPSEEK_HARNESS_NPM_PROBE
    }
  },
  {
    id: "devin",
    displayName: "Devin CLI",
    runtime: {
      flags: ["-dv", "--devin"],
      description: "Run as Devin CLI PreToolUse hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--devin",
      artifactKind: "hook config",
      probeCommand: ["devin", "--version"]
    }
  },
  {
    id: "droid",
    displayName: "Factory Droid",
    runtime: {
      flags: ["-fd", "--droid"],
      description: "Run as Factory Droid PreToolUse hook",
      legacyTopLevelFlags: []
    },
    install: {
      flag: "--droid",
      artifactKind: "hook config",
      probeCommand: ["droid", "--version"]
    }
  },
  {
    id: "amp",
    displayName: "Amp Code",
    install: {
      flag: "--amp",
      artifactKind: "plugin",
      probeCommand: ["amp", "--version"]
    }
  }
];
var catalogByDisplayName = catalog.slice().sort((a, b) => a.displayName.localeCompare(b.displayName, "en"));
var doctorIntegrationOrder = catalogByDisplayName.map((integration) => integration.id).sort((a, b) => Number(b === "claude-code") - Number(a === "claude-code"));
var runtimeHookIntegrationMetadata = catalogByDisplayName.filter((integration) => ("runtime" in integration)).map((integration) => ({
  id: integration.id,
  displayName: "displayName" in integration.runtime ? integration.runtime.displayName : integration.displayName,
  flags: integration.runtime.flags,
  legacyFlags: "legacyFlags" in integration.runtime ? integration.runtime.legacyFlags : [],
  description: integration.runtime.description,
  legacyTopLevelFlags: integration.runtime.legacyTopLevelFlags
}));
var installIntegrationMetadata = catalogByDisplayName.map((integration) => ({
  id: integration.id,
  ...integration.install
}));
var integrationDisplayNames = Object.fromEntries(catalog.map((integration) => [integration.id, integration.displayName]));

// src/gui/frontend/ui.ts
var agentLabels = integrationDisplayNames;
var shared = {
  policy: undefined,
  dirty: false,
  drafting: false
};
var emit = (name) => document.dispatchEvent(new Event(\`ccsn:\${name}\`));
var on = (name, listener) => document.addEventListener(\`ccsn:\${name}\`, listener);
var qs = (id) => document.getElementById(id);
var requestJson = async (path, init = {}) => {
  const token = guiData.token;
  try {
    const response = await fetch(\`\${path}\${path.includes("?") ? "&" : "?"}token=\${encodeURIComponent(token)}\`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-cc-safety-net-token": token,
        ...init.headers
      }
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data: text ? JSON.parse(text) : {},
      error: undefined
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: undefined,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
var errorText = (result) => result.error ?? (Array.isArray(result.data?.errors) && result.data.errors.length ? result.data.errors.join(\`
\`) : null) ?? result.data?.error ?? t.requestFailed(result.status);
var isWriteSuccess = (result) => result.ok && !(Array.isArray(result.data?.errors) && result.data.errors.length > 0);
var escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[char] ?? char);
var notifyTimer;
var notify = (title, kind = "info", detail = "") => {
  clearTimeout(notifyTimer);
  qs("toast").hidden = title === "";
  qs("toast").className = \`toast \${kind}\`;
  qs("toast-title").textContent = title;
  qs("toast-detail").textContent = detail;
  qs("toast-detail").hidden = detail === "";
  if (kind === "ok")
    notifyTimer = setTimeout(() => notify(""), 4000);
};
var savePreference = async (update) => {
  const result = await requestJson("/api/preferences", {
    method: "POST",
    body: JSON.stringify(update)
  });
  const saved = isWriteSuccess(result);
  if (!saved)
    notify(t.preferenceSaveFailed, "error", errorText(result));
  return saved;
};
var icons = {
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"></path></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',
  remove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>'
};
var showingCopied = new WeakSet;
var copyText = async (button, text) => {
  const copied = await navigator.clipboard.writeText(text).then(() => true, () => false);
  if (!copied) {
    notify(t.copyFailed, "error");
    return;
  }
  if (showingCopied.has(button))
    return;
  showingCopied.add(button);
  const label = button.innerHTML;
  button.innerHTML = \`\${icons.check}<span>\${escapeHtml(t.copied)}</span>\`;
  setTimeout(() => {
    button.innerHTML = label;
    showingCopied.delete(button);
  }, 1500);
};
var showPath = (id, path, suffix = "") => {
  const element = qs(id);
  element.dataset.path = path;
  element.innerHTML = path.split(/(?<=[\\\\/])/).map((part) => \`<span class="path-part">\${escapeHtml(part)}</span>\`).join("") + escapeHtml(suffix);
  document.querySelector(\`[data-copy-path="\${id}"]\`)?.toggleAttribute("hidden", path === "");
};
var runRefresh = async (button, reload) => {
  if (button.disabled)
    return;
  button.disabled = true;
  await reload();
  button.disabled = false;
};
var resolvePendingConfirm = null;
var initConfirmDialog = () => {
  const dialog = qs("confirm-dialog");
  dialog.addEventListener("close", () => {
    if (!resolvePendingConfirm)
      return;
    resolvePendingConfirm(dialog.returnValue === "confirm");
    resolvePendingConfirm = null;
  });
  dialog.addEventListener("cancel", () => {
    dialog.returnValue = "cancel";
  });
};
var confirmDialog = (options) => new Promise((resolve) => {
  if (resolvePendingConfirm) {
    resolve(false);
    return;
  }
  const dialog = qs("confirm-dialog");
  const confirm = qs("confirm-dialog-confirm");
  qs("confirm-dialog-title").textContent = options.title;
  qs("confirm-dialog-body").textContent = options.body;
  qs("confirm-dialog-detail").textContent = options.detail ?? "";
  qs("confirm-dialog-detail").parentElement.hidden = !options.detail;
  qs("confirm-dialog-rows").innerHTML = options.rowsHtml ?? "";
  qs("confirm-dialog-rows").hidden = !options.rowsHtml;
  confirm.textContent = options.confirmLabel;
  confirm.className = options.confirmClass ?? "danger";
  dialog.returnValue = "cancel";
  resolvePendingConfirm = resolve;
  dialog.showModal();
  qs("confirm-dialog-cancel").focus();
});

// src/audit/display.ts
var commandSignature = (source) => {
  const tokens = (source ?? "").trim().split(/\\s+/).filter((token) => token && !/^[A-Za-z_][A-Za-z0-9_]*=/.test(token));
  const binary = tokens[0]?.split("/").pop();
  if (!binary)
    return null;
  const next = tokens[1];
  return next && /^[a-z][a-z0-9-]*$/.test(next) ? \`\${binary} \${next}\` : binary;
};
function findSuspectEntries(entries) {
  const signatureKey = (entry) => \`\${entry.sessionId}
\${commandSignature(entry.segment || entry.command)}\`;
  const denials = entries.filter((entry) => entry.decision !== "allow");
  const repeats = denials.filter((entry) => entry.sessionId).reduce((counts, entry) => counts.set(signatureKey(entry), (counts.get(signatureKey(entry)) ?? 0) + 1), new Map);
  return new Set(denials.filter((entry) => entry.failureStage || (repeats.get(signatureKey(entry)) ?? 0) >= 2));
}

// src/core/policy/audit-retention-days.ts
var DEFAULT_AUDIT_RETENTION_DAYS = 30;
var MIN_AUDIT_RETENTION_DAYS = 1;
var MAX_AUDIT_RETENTION_DAYS = 365;

// src/gui/frontend/format.ts
var repoUrl = "https://github.com/kenryu42/cc-safety-net";
var viewHash = (view, fields) => {
  const params = new URLSearchParams(fields.filter(([, value, fallback]) => value !== fallback).map(([key, value]) => [key, value]));
  return params.size > 0 ? \`\${view}?\${params}\` : view;
};

// src/gui/frontend/activity-filter.ts
var initialActivityFilters = () => ({
  days: 7,
  decision: "deny",
  agent: "all",
  query: "",
  command: ""
});
var decisions = new Set(["all", "deny", "allow", "error", "suspect"]);
var activityFiltersFromParams = (params) => {
  const defaults = initialActivityFilters();
  const days = Number(params.get("days"));
  const decision = params.get("decision") ?? "";
  return {
    days: Number.isInteger(days) && days > 0 ? days : defaults.days,
    decision: decisions.has(decision) ? decision : defaults.decision,
    agent: params.get("agent") ?? defaults.agent,
    query: params.get("q") ?? defaults.query,
    command: params.get("command") ?? defaults.command
  };
};
var activityHash = (filters) => {
  const defaults = initialActivityFilters();
  return viewHash("activity", [
    ["days", String(filters.days), String(defaults.days)],
    ["decision", filters.decision, defaults.decision],
    ["agent", filters.agent, defaults.agent],
    ["q", filters.query, defaults.query],
    ["command", filters.command, defaults.command]
  ]);
};
var visibleEntries = (entries, filters, suspects) => entries.filter((entry) => {
  const decisionMatches = {
    all: true,
    deny: entry.decision !== "allow",
    allow: entry.decision === "allow",
    error: Boolean(entry.failureStage),
    suspect: suspects.has(entry)
  }[filters.decision];
  if (!decisionMatches)
    return false;
  if (filters.agent !== "all" && (entry.agent || "unknown") !== filters.agent)
    return false;
  if (filters.command)
    return commandSignature(entry.segment || entry.command) === filters.command;
  return [entry.ruleId, entry.segment || entry.command].filter(Boolean).join(" ").toLowerCase().includes(filters.query.trim().toLowerCase());
});

// src/gui/frontend/report.ts
var reportIssueUrl = "https://github.com/kenryu42/cc-safety-net/issues/new?template=false_positive.yml";
var reportUrlLimit = 8000;
var titleCommandLimit = 80;
var reportTitle = (ruleId, command) => {
  const firstLine = command.trim().split(\`
\`)[0] ?? "";
  const shown = firstLine.length > titleCommandLimit ? \`\${firstLine.slice(0, titleCommandLimit)}…\` : firstLine;
  return \`[False Positive]: \${ruleId ? \`\${ruleId} \` : ""}blocked \\\`\${shown}\\\`\`;
};
var endsAtPathBoundary = (following) => following === "" || /^[/\\\\\\s'"]/.test(following);
var scrubReportPaths = (text, cwd, home) => [
  [cwd, "<project>"],
  [home, "~"]
].reduce((scrubbed, [from, to]) => from ? scrubbed.split(from).reduce((joined, part) => joined + (endsAtPathBoundary(part) ? to : from) + part) : scrubbed, text);
var buildReportUrl = (fields) => {
  const url = new URL(reportIssueUrl);
  Object.entries(fields).filter(([, value]) => value).forEach(([field, value]) => {
    url.searchParams.set(field, value);
  });
  return url.toString();
};
var buildReportRequest = (fields, dropped = []) => {
  const url = buildReportUrl(fields);
  if (url.length <= reportUrlLimit)
    return { url, dropped };
  const largest = Object.entries(fields).filter(([, value]) => value).sort((left, right) => right[1].length - left[1].length)[0];
  if (!largest)
    return { url, dropped };
  return buildReportRequest({ ...fields, [largest[0]]: "" }, [...dropped, largest[0]]);
};

// src/core/policy/safety-level.ts
var SAFETY_LEVEL_CAPABILITIES = {
  standard: { fail_closed: false, paranoid_rm: false, paranoid_interpreters: false },
  strict: { fail_closed: true, paranoid_rm: false, paranoid_interpreters: false },
  paranoid: { fail_closed: true, paranoid_rm: true, paranoid_interpreters: true }
};

// src/gui/frontend/health.ts
var groupIntegrations = (rows) => ({
  installed: rows.filter((row) => row.status === "active"),
  available: rows.filter((row) => row.status !== "active" && row.version !== null),
  missing: rows.filter((row) => row.status !== "active" && row.version === null)
});
var attentionItems = (facts, t) => [
  ...(facts.targets ?? []).filter((row) => row.status === "disabled").map((row) => ({
    text: t.hookDisabledAttention(row.label),
    href: "#integrations"
  })),
  facts.suspects > 0 ? {
    text: t.suspectAttention(facts.suspects, facts.days),
    href: "#activity?decision=suspect"
  } : null,
  facts.errors > 0 ? {
    text: t.guardErrorAttention(facts.errors, facts.days),
    href: "#activity?decision=error"
  } : null,
  facts.update?.updateAvailable ? {
    text: t.updateAttention(facts.update.latestVersion ?? ""),
    href: \`\${repoUrl}/releases\`
  } : null
].filter((item) => item !== null);

// src/gui/frontend/policy-summary.ts
var safetyLevels = (t) => ({
  standard: [t.presetStandard, t.presetStandardDescription],
  strict: [t.presetStrict, t.presetStrictDescription],
  paranoid: [t.presetParanoid, t.presetParanoidDescription]
});
var capabilityNames = (t) => ({
  fail_closed: [t.capabilityFailClosed, t.capabilityFailClosedDescription],
  paranoid_rm: [t.capabilityParanoidRm, t.capabilityParanoidRmDescription],
  paranoid_interpreters: [
    t.capabilityParanoidInterpreters,
    t.capabilityParanoidInterpretersDescription
  ]
});
var levelName = (level, t) => safetyLevels(t)[level][0];
var tierForRule = (rule) => !rule.activationCapability ? "normal" : rule.activationCapability === "fail_closed" ? "strict" : "paranoid";
var commandRuleGroups = (rules, t) => {
  const alwaysOn = rules.filter((rule) => rule.catastrophic);
  const configurable = rules.filter((rule) => !rule.catastrophic);
  return [
    ...alwaysOn.length > 0 ? [{ key: "always-on", title: t.alwaysOn, rules: alwaysOn }] : [],
    ...[...new Set(configurable.map((rule) => rule.category))].map((category) => ({
      key: category,
      title: category,
      rules: configurable.filter((rule) => rule.category === category)
    }))
  ];
};
var policyFiltersFromParams = (params) => ({
  query: params.get("q") ?? "",
  changedOnly: params.get("show") === "changed"
});
var policyHash = (filters) => viewHash("policy", [
  ["q", filters.query, ""],
  ["show", filters.changedOnly ? "changed" : "all", "all"]
]);
var ruleNote = (rule, effective, capabilities, t) => {
  const capability = rule.activationCapability;
  if (effective.source === "rule_override")
    return t.changedByYou;
  if (effective.source === "capability_override" && capability)
    return t.forcedInAdvanced(capabilityNames(t)[capability][0], effective.enabled);
  if (effective.source === "environment") {
    const source = [...capability ? capabilities[capability]?.sources ?? [] : []].reverse().find((item) => item.startsWith("env "));
    return source ? t.setByEnvironmentVariable(source.slice(4)) : t.setByEnvironment;
  }
  if (effective.enabled || effective.source === "master_disabled")
    return null;
  return t.needsPreset(tierForRule(rule) === "strict" ? t.presetStrict : t.presetParanoid);
};
var policyChanges = (saved, draft, labels, t) => {
  const onOff = (value) => value ? t.stateOn : t.stateOff;
  const capabilities = capabilityNames(t);
  const overrideChanges = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((id) => before[id] !== after[id]).map((id) => t.settingChange(labels[id] ?? id, after[id] === undefined ? t.stateDefault : onOff(after[id] === "on")));
  const pathChanges = (name, before, after) => {
    const added = after.filter((path) => !before.includes(path)).length;
    const removed = before.filter((path) => !after.includes(path)).length;
    if (added === 0 && removed === 0)
      return null;
    return t.settingChange(name, [added ? t.pathsAdded(added) : "", removed ? t.pathsRemoved(removed) : ""].filter(Boolean).join(t.listSeparator));
  };
  return [
    saved.safety.level === draft.safety.level ? null : t.settingChange(t.presetLabel, \`\${levelName(saved.safety.level, t)} → \${levelName(draft.safety.level, t)}\`),
    ...Object.keys(capabilities).filter((key) => saved.safety.overrides[key] !== draft.safety.overrides[key]).map((key) => {
      const value = draft.safety.overrides[key];
      return t.settingChange(capabilities[key][0], value === undefined ? t.fromPreset : value ? t.forcedOn : t.forcedOff);
    }),
    saved.workflow.worktree_mode === draft.workflow.worktree_mode ? null : t.settingChange(t.worktreeChange, draft.workflow.worktree_mode ? t.allowed : t.blocked),
    saved.destructive_command_protection.enabled === draft.destructive_command_protection.enabled ? null : t.settingChange(t.commandProtection, onOff(draft.destructive_command_protection.enabled)),
    saved.secret_protection.enabled === draft.secret_protection.enabled ? null : t.settingChange(t.secretProtection, onOff(draft.secret_protection.enabled)),
    ...overrideChanges(saved.destructive_command_protection.overrides, draft.destructive_command_protection.overrides),
    ...overrideChanges(saved.secret_protection.overrides, draft.secret_protection.overrides),
    pathChanges(t.allowPathsChange, saved.destructive_command_protection.allow_paths, draft.destructive_command_protection.allow_paths),
    pathChanges(t.denyPathsChange, saved.secret_protection.deny_paths, draft.secret_protection.deny_paths),
    pathChanges(t.secretAllowPathsChange, saved.secret_protection.allow_paths, draft.secret_protection.allow_paths)
  ].filter((change) => change !== null);
};

// src/gui/frontend/views/integrations.ts
var targets = null;
var busy = new Set;
var integrationTargets = () => targets;
var statusText = (row) => ({
  active: t.hookInstalled,
  disabled: t.hookDisabled,
  "not-installed": "",
  "not-inspected": t.hookStatusUnknown
})[row.status];
var rowHtml = (row) => {
  const uninstall = row.status === "active";
  const action = row.version === null ? "" : \`<button type="button" data-integration-action="\${uninstall ? "uninstall" : "install"}" data-integration-target="\${escapeHtml(row.target)}"\${busy.has(row.target) ? " disabled" : ""}>\${busy.has(row.target) ? uninstall ? t.uninstalling : t.installing : uninstall ? t.uninstall : row.status === "disabled" ? t.enable : t.install}</button>\`;
  return \`<li class="setting-row agent-row">
    <span class="agent-name">\${escapeHtml(row.label)}</span>
    <span class="agent-version"\${row.version === null ? "" : \` title="v\${escapeHtml(row.version)}"\`}>\${row.version === null ? t.notDetected : \`v\${escapeHtml(row.version)}\`}</span>
    <span class="agent-status \${row.status}">\${statusText(row)}</span>
    <span class="agent-action">\${action}</span>
    \${row.note ? \`<p class="notice \${row.note.kind}">\${escapeHtml(row.note.text)}</p>\` : ""}
  </li>\`;
};
var groupHtml = (title, rows, sub = "") => rows.length === 0 ? "" : \`<section class="section"><div class="section-head"><div><h3 class="section-title">\${title} <span class="count">\${rows.length}</span></h3>\${sub ? \`<p class="section-sub">\${sub}</p>\` : ""}</div></div><ul class="card rows">\${rows.map(rowHtml).join("")}</ul></section>\`;
var render = () => {
  if (!targets)
    return;
  const groups = groupIntegrations(targets);
  qs("integrations-list").innerHTML = groupHtml(t.installedAgents, groups.installed) + groupHtml(t.detectedAgents, groups.available, groups.installed.length === 0 ? t.noHookYet : "") + (groups.missing.length === 0 ? "" : \`<details class="section missing-agents"><summary>\${t.missingAgents} <span class="count">\${groups.missing.length}</span></summary><ul class="card rows">\${groups.missing.map(rowHtml).join("")}</ul></details>\`);
};
var loadIntegrations = async () => {
  const result = await requestJson("/api/integrations");
  if (!result.ok || !Array.isArray(result.data?.targets)) {
    qs("integrations-list").innerHTML = \`<p class="empty">\${escapeHtml(t.couldNotCheckAgents(errorText(result)))}</p>\`;
    return;
  }
  targets = result.data.targets;
  qs("integrations-node-version").textContent = result.data.system.nodeVersion ?? t.unknownValue;
  qs("integrations-platform").textContent = result.data.system.platform;
  render();
  emit("integrations");
};
var runAction = async (button) => {
  const target = button.dataset.integrationTarget;
  const action = button.dataset.integrationAction;
  if (!target || busy.has(target))
    return;
  busy.add(target);
  render();
  const result = await requestJson(\`/api/\${action}\`, {
    method: "POST",
    body: JSON.stringify({ target })
  });
  busy.delete(target);
  const row = targets?.find((entry) => entry.target === target);
  if (!row)
    return;
  const ok = result.ok && result.data.ok === true;
  if (ok)
    row.status = action === "install" ? "active" : "not-installed";
  row.note = {
    kind: ok ? "ok" : "error",
    text: ok ? result.data.output : result.data?.output || errorText(result)
  };
  if (!ok)
    notify(action === "install" ? t.installFailed : t.uninstallFailed, "error");
  render();
  emit("integrations");
};
var initIntegrations = () => {
  qs("integrations-refresh").addEventListener("click", (event) => {
    runRefresh(event.currentTarget, loadIntegrations);
  });
  qs("integrations-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-integration-action]");
    if (button)
      runAction(button);
  });
};

// src/gui/frontend/views/overview.ts
var OVERVIEW_DAYS = 7;
var feed = null;
var update = null;
var renderStatusCard = () => {
  const loaded = shared.policy;
  if (!loaded)
    return;
  const targets = integrationTargets();
  const active = (targets ?? []).filter((row) => row.status === "active");
  const policy = loaded.policy;
  const off = [
    policy.destructive_command_protection.enabled ? null : t.commandProtectionIsOff,
    policy.secret_protection.enabled ? null : t.secretProtectionIsOff
  ].filter((text) => text !== null);
  const noAgent = loaded.errors.length === 0 && targets !== null && active.length === 0;
  const headline = loaded.errors.length > 0 ? t.statusRepair : !targets ? t.statusCheckingAgents : noAgent ? t.statusNoAgent : off.length > 0 ? t.statusPartlyProtected : t.statusProtected;
  const customized = (loaded.preview?.counts.effectiveCustomizations ?? 0) > 0 || Object.entries(policy.safety.overrides).some(([key, value]) => value !== SAFETY_LEVEL_CAPABILITIES[policy.safety.level][key]);
  const facts = [
    t.presetFact(levelName(policy.safety.level, t), customized),
    ...off.length > 0 ? off : [
      loaded.preview ? t.commandRulesOn(loaded.preview.counts.enabled) : null,
      t.secretProtectionIsOn
    ],
    active.length > 0 ? t.hookActiveIn(active.length <= 3 ? active.map((row) => row.label).join(t.listSeparator) : t.agentCount(active.length)) : null
  ].filter((text) => text !== null);
  const [actionHref, actionLabel] = noAgent ? ["#integrations", t.installHook] : ["#policy", loaded.errors.length > 0 ? t.repair : t.configure];
  qs("status-card").innerHTML = \`<div>
      <p class="status-headline">\${escapeHtml(headline)}</p>
      <p class="status-facts">\${facts.map(escapeHtml).join(" · ")}</p>
    </div>
    <a class="link-button" href="\${actionHref}">\${escapeHtml(actionLabel)}</a>\`;
};
var renderAttention = () => {
  const items = attentionItems({
    targets: integrationTargets(),
    update,
    errors: feed?.counts.errors ?? 0,
    suspects: feed ? findSuspectEntries(feed.entries).size : 0,
    days: feed?.days ?? OVERVIEW_DAYS
  }, t);
  qs("attention").hidden = items.length === 0;
  qs("attention-list").innerHTML = items.map((item) => \`<li class="list-row attention-row"><span>\${escapeHtml(item.text)}</span><a class="link-button" href="\${escapeHtml(item.href)}"\${item.href.startsWith("#") ? "" : ' target="_blank" rel="noopener"'}>\${escapeHtml(item.href.startsWith("#activity") ? t.review : item.href.startsWith("#") ? t.fix : t.releaseNotes)}</a></li>\`).join("");
};
var sparkline = (byDay, noun) => {
  const max = Math.max(...byDay, 1);
  return \`<div class="tile-spark" role="img" aria-label="\${escapeHtml(t.perDayChart(noun, byDay.map(formatCount).join(t.listSeparator)))}">\${byDay.map((count) => \`<span class="spark-bar\${count === 0 ? " spark-zero" : ""}" style="height:\${count === 0 ? 2 : Math.max(3, Math.round(count / max * 36))}px" title="\${formatCount(count)}"></span>\`).join("")}</div>\`;
};
var ruleHref = (ruleId) => ruleId.startsWith("custom.") ? \`#rules?focus=\${encodeURIComponent(ruleId)}\` : \`#activity?q=\${encodeURIComponent(ruleId)}\`;
var renderActivity = () => {
  if (!feed)
    return;
  const loaded = feed;
  qs("overview-tiles").innerHTML = [
    [loaded.counts.blocked, t.tileBlocked, loaded.counts.blockedByDay],
    [loaded.totalInWindow, t.tileChecked, loaded.counts.analyzedByDay]
  ].map(([value, label, byDay]) => \`<div class="tile"><div><strong>\${formatCount(value)}</strong><span>\${escapeHtml(\`\${label} · \${t.lastDays(loaded.days)}\`)}</span></div>\${sparkline(byDay, label)}</div>\`).join("");
  const blocks = loaded.entries.filter((entry) => entry.decision !== "allow").slice(0, 8);
  qs("recent-blocks").innerHTML = blocks.length === 0 ? \`<p class="empty">\${escapeHtml(t.nothingBlocked(loaded.days))}</p>\` : \`<ul class="card list">\${blocks.map((entry) => \`<li><a class="list-row compact-row" href="\${entry.ruleId ? ruleHref(entry.ruleId) : "#activity"}">
              <time datetime="\${escapeHtml(entry.ts)}">\${escapeHtml(formatRelativeTime(entry.ts))}</time>
              <span class="feed-agent">\${escapeHtml(entry.agent && entry.agent !== "unknown" ? agentLabels[entry.agent] ?? entry.agent : "")}</span>
              <code class="feed-command">\${escapeHtml(entry.segment || entry.command || t.noCommandRecorded)}</code>
              <span class="feed-rule">\${escapeHtml(entry.failureStage ? t.guardError : entry.ruleId ?? "")}</span>
            </a></li>\`).join("")}</ul>\`;
  const top = Object.entries(loaded.counts.rules).sort((a, b) => b[1] - a[1]).slice(0, 5);
  qs("top-rules-title").textContent = \`\${t.topRules} · \${t.lastDays(loaded.days)}\`;
  qs("top-rules").innerHTML = top.length === 0 ? \`<p class="empty">\${escapeHtml(t.noRuleBlocked)}</p>\` : \`<ul class="card list">\${top.map(([ruleId, count]) => \`<li><a class="list-row rule-count-row" href="\${ruleHref(ruleId)}">
              <code class="rule-label">\${escapeHtml(ruleId)}</code>
              <span class="count">\${escapeHtml(t.blockCount(count))}</span>
            </a></li>\`).join("")}</ul>\`;
};
var loadOverview = async () => {
  const result = await requestJson(\`/api/activity?days=\${Math.min(OVERVIEW_DAYS, retentionDays())}\`);
  if (!result.ok || !result.data) {
    qs("recent-blocks").innerHTML = \`<p class="empty">\${escapeHtml(t.couldNotLoadActivity(errorText(result)))}</p>\`;
    return;
  }
  feed = result.data;
  renderActivity();
  renderAttention();
};
var loadHealth = async () => {
  const result = await requestJson("/api/health");
  update = result.ok ? result.data?.update ?? null : null;
  renderAttention();
};
var starIcons = {
  outline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"></path></svg>',
  filled: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"></path></svg>'
};
var starContext = { starCount: null, blockedTotal: 0 };
var starCountHtml = (count) => typeof count === "number" ? \`<span class="star-count">\${count >= 1000 ? \`\${(count / 1000).toFixed(1).replace(/\\.0$/, "")}k\` : count}</span>\` : "";
var renderStarPitch = (starred) => {
  const evidence = starContext.blockedTotal > 0 ? t.starEvidence(starContext.blockedTotal, retentionDays()) : "";
  qs("star-pitch-text").innerHTML = starred ? evidence : evidence ? \`\${evidence} \${t.starIfSaved}\` : t.starIfUseful;
};
var renderStarLink = (href) => {
  qs("star-slot").innerHTML = \`<a class="star-cta" href="\${escapeHtml(href)}" target="_blank" rel="noopener" aria-label="\${escapeHtml(t.starLinkLabel)}"><span class="star-icon" aria-hidden="true">\${starIcons.outline}</span><span class="star-label">\${escapeHtml(t.starOnGitHub)}</span>\${starCountHtml(starContext.starCount)}</a>\`;
  qs("star-row").hidden = false;
};
var loadStarContext = async () => {
  const result = await requestJson("/api/star/context");
  starContext = result.ok && result.data ? result.data : { starCount: null, blockedTotal: 0 };
  renderStarPitch(false);
  qs("star-slot").innerHTML = \`<button type="button" class="star-cta" aria-label="\${escapeHtml(t.starButtonLabel)}"><span class="star-icon" aria-hidden="true">\${starIcons.outline}</span><span class="star-label">\${escapeHtml(t.starOnGitHub)}</span>\${starCountHtml(starContext.starCount)}</button>\`;
  qs("star-row").hidden = false;
};
var starRepo = async (button) => {
  button.disabled = true;
  const result = await requestJson("/api/star", { method: "POST" });
  if (!(result.ok && result.data?.ok === true)) {
    renderStarLink(result.data?.fallbackUrl ?? repoUrl);
    return;
  }
  button.querySelector(".star-icon").innerHTML = starIcons.filled;
  button.querySelector(".star-label").textContent = t.starred;
  button.setAttribute("aria-label", t.starredLabel);
  button.classList.add("starred");
  renderStarPitch(true);
};
var initOverview = () => {
  on("policy", renderStatusCard);
  on("integrations", () => {
    renderStatusCard();
    renderAttention();
  });
  qs("star-slot").addEventListener("click", (event) => {
    const button = event.target.closest(".star-cta");
    if (button instanceof HTMLButtonElement)
      starRepo(button);
  });
};

// src/gui/frontend/views/activity.ts
var filters = initialActivityFilters();
var activity = null;
var suspects = new Set;
var renderedEntries = [];
var queryTimer;
var syncHash = () => {
  if (document.body.dataset.view === "activity")
    history.replaceState(null, "", \`#\${activityHash(filters)}\`);
};
var retentionDays = () => shared.policy?.policy.audit.retention_days ?? DEFAULT_AUDIT_RETENTION_DAYS;
var knownRuleIds = () => new Set([
  ...shared.policy?.destructiveCommandRules ?? [],
  ...shared.policy?.secretPatterns ?? []
].map((rule) => rule.id));
var decisionLabel = (entry) => entry.failureStage ? t.decisionError : entry.decision === "allow" ? t.decisionAllowed : t.decisionBlocked;
var reportFieldNames = {
  title: t.reportNameTitle,
  expected: t.reportNameExpected,
  command: t.reportNameCommand,
  entry: t.reportNameEntry
};
var ruleLink = (ruleId) => ruleId.startsWith("custom.") ? \`<a class="rule-id" href="#rules?focus=\${encodeURIComponent(ruleId)}" title="\${escapeHtml(t.showCustomRule)}">\${escapeHtml(ruleId)}</a>\` : knownRuleIds().has(ruleId) ? \`<a class="rule-id" href="#policy?q=\${encodeURIComponent(ruleId)}" title="\${escapeHtml(t.showProtection)}">\${escapeHtml(ruleId)}</a>\` : \`<code class="rule-id">\${escapeHtml(ruleId)}</code>\`;
var entryCommand = (entry) => entry.segment || entry.command || "";
var feedRowHtml = (entry, index) => {
  const blocked = entry.decision !== "allow";
  const command = entryCommand(entry);
  const agent = entry.agent && entry.agent !== "unknown" ? agentLabels[entry.agent] ?? entry.agent : "";
  const detailRows = [
    entry.command && entry.command !== command ? [t.detailFullCommand, \`<code class="block">\${escapeHtml(entry.command)}</code>\`] : null,
    entry.reason && entry.reason !== "allowed" ? [t.detailReason, escapeHtml(entry.reason)] : null,
    entry.ruleId ? [t.detailRule, ruleLink(entry.ruleId)] : null,
    entry.cwd ? [t.detailFolder, \`<code>\${escapeHtml(entry.cwd)}</code>\`] : null,
    [
      t.detailTime,
      \`\${escapeHtml(formatDateTime(entry.ts))} (\${escapeHtml(formatRelativeTime(entry.ts))})\`
    ]
  ].filter((row) => row !== null);
  return \`<li class="feed-row">
    <button type="button" class="feed-summary" aria-expanded="false" aria-controls="feed-detail-\${index}">
      <span class="chevron" aria-hidden="true"></span>
      <time datetime="\${escapeHtml(entry.ts)}">\${escapeHtml(formatClockTime(entry.ts))}</time>
      <span class="decision \${entry.failureStage ? "error" : blocked ? "deny" : "allow"}">\${decisionLabel(entry)}</span>
      <span class="feed-agent">\${escapeHtml(agent)}</span>
      <code class="feed-command">\${escapeHtml(command || t.noCommandRecorded)}</code>
      <span class="feed-rule">\${escapeHtml(entry.ruleId ?? "")}</span>
    </button>
    <div class="feed-detail" id="feed-detail-\${index}" hidden>
      <code class="block detail-command">\${escapeHtml(command || t.noCommandRecorded)}</code>
      <div class="detail-actions">
        \${blocked ? \`<button type="button" class="primary" data-report-fp="\${index}">\${escapeHtml(t.reportFalsePositive)}</button>\` : \`<button type="button" class="primary" data-block-future="\${index}">\${escapeHtml(t.blockInFuture)}</button>\`}
        <button type="button" data-log-copy="\${index}">\${icons.copy}<span>\${escapeHtml(t.copyLogEntry)}</span></button>
      </div>
      <dl class="detail-rows">\${detailRows.map(([term, value]) => \`<div><dt>\${escapeHtml(term)}</dt><dd>\${value}</dd></div>\`).join("")}</dl>
    </div>
  </li>\`;
};
var renderControls = () => {
  if (!activity)
    return;
  const loaded = activity;
  const segment = (value, label, count) => \`<button type="button" data-activity-decision="\${value}" aria-pressed="\${filters.decision === value}">\${escapeHtml(label)} <span class="count">\${formatCount(count)}</span></button>\`;
  qs("activity-decision").innerHTML = [
    segment("deny", t.decisionBlocked, loaded.counts.blocked),
    segment("allow", t.decisionAllowed, loaded.counts.allowed),
    ...loaded.counts.errors > 0 ? [segment("error", t.filterErrors, loaded.counts.errors)] : [],
    ...suspects.size > 0 ? [segment("suspect", t.filterSuspect, suspects.size)] : [],
    segment("all", t.filterAll, loaded.totalInWindow)
  ].join("");
  const agentNames = Object.keys(loaded.counts.agents).filter((name) => name !== "unknown").sort();
  qs("activity-agent").innerHTML = [
    \`<option value="all">\${escapeHtml(t.allAgents)}</option>\`,
    ...agentNames.map((name) => \`<option value="\${escapeHtml(name)}">\${escapeHtml(agentLabels[name] ?? name)} (\${formatCount(loaded.counts.agents[name] ?? 0)})</option>\`)
  ].join("");
  qs("activity-agent").value = filters.agent;
  qs("activity-agent").parentElement?.toggleAttribute("hidden", agentNames.length < 2);
  const retained = retentionDays();
  qs("activity-days").innerHTML = [
    ...new Set([...[7, 30, 90, 180, 365].filter((days) => days < retained), retained, loaded.days])
  ].sort((left, right) => left - right).map((days) => \`<option value="\${days}">\${escapeHtml(t.lastDaysOption(days))}</option>\`).join("");
  qs("activity-days").value = String(loaded.days);
  qs("activity-command-filter").hidden = !filters.command;
  qs("activity-command-filter").innerHTML = filters.command ? \`\${escapeHtml(t.showingBlocksOf)} <code>\${escapeHtml(filters.command)}</code> <button type="button" class="quiet" data-clear-command>\${escapeHtml(t.showAllBlocks)}</button>\` : "";
};
var emptyMessage = () => {
  if (filters.query || filters.command || filters.agent !== "all")
    return escapeHtml(t.noFilterMatch);
  if (filters.decision === "deny")
    return \`\${escapeHtml(t.nothingBlocked(activity?.days ?? filters.days))} <button type="button" class="quiet" data-activity-decision="all">\${escapeHtml(t.showAllActivity)}</button>\`;
  return escapeHtml(t.noLogEntries);
};
var renderFeed = () => {
  if (!activity)
    return;
  const entries = visibleEntries(activity.entries, filters, suspects);
  renderedEntries = entries;
  qs("activity-feed").innerHTML = entries.length === 0 ? \`<p class="empty">\${emptyMessage()}</p>\` : entries.map((entry, index) => {
    const label = formatDayHeading(entry.ts);
    const previous = entries[index - 1];
    const heading = previous && formatDayHeading(previous.ts) === label ? "" : \`\${index === 0 ? "" : "</ul>"}<h4 class="day-heading">\${escapeHtml(label)}</h4><ul class="feed-list">\`;
    return heading + feedRowHtml(entry, index);
  }).join("") + "</ul>";
  qs("activity-count").textContent = [
    t.showingEntries(entries.length, activity.totalInWindow, activity.days),
    activity.truncated ? t.activityTruncated : "",
    activity.unreadable > 0 ? t.unreadableLogs(activity.unreadable) : ""
  ].filter(Boolean).join(" ");
};
var loadActivity = async () => {
  const result = await requestJson(\`/api/activity?days=\${filters.days}\`);
  if (!result.ok || !result.data) {
    qs("activity-feed").innerHTML = \`<p class="empty">\${escapeHtml(t.couldNotLoadActivity(errorText(result)))}</p>\`;
    qs("activity-count").textContent = "";
    return;
  }
  activity = result.data;
  suspects = findSuspectEntries(activity.entries);
  showPath("logs-path", activity.logsDir ?? "", activity.logsDir ? "" : t.notAvailable);
  if (filters.agent !== "all" && !(filters.agent in activity.counts.agents))
    filters.agent = "all";
  if (filters.decision === "error" && activity.counts.errors === 0)
    filters.decision = "deny";
  if (filters.decision === "suspect" && suspects.size === 0)
    filters.decision = "deny";
  renderControls();
  renderFeed();
  syncHash();
};
var limitActivityDays = (days) => {
  filters.days = Math.min(filters.days, days);
};
var rerender = () => {
  renderControls();
  renderFeed();
  syncHash();
};
var showActivity = (params) => {
  const next = activityFiltersFromParams(params);
  if (shared.policy)
    next.days = Math.min(next.days, retentionDays());
  if (activityHash(next) === activityHash(filters))
    return;
  const reload = next.days !== filters.days;
  Object.assign(filters, next);
  qs("activity-search").value = filters.query;
  if (reload && activity) {
    loadActivity();
    return;
  }
  rerender();
};
var openReportDialog = (entry) => {
  const scrub = (text) => scrubReportPaths(text, entry.cwd, activity?.homeDir);
  qs("report-command").value = scrub(entry.command || entry.segment || "");
  qs("report-title").value = reportTitle(entry.ruleId, scrub(entry.segment || entry.command || ""));
  qs("report-why").value = "";
  qs("report-entry").value = JSON.stringify(entry, (_key, value) => typeof value === "string" ? scrub(value) : value, 2);
  qs("report-dialog").returnValue = "cancel";
  qs("report-dialog").showModal();
};
var openFalsePositiveForm = async () => {
  const fields = {
    title: qs("report-title").value,
    expected: qs("report-why").value.trim(),
    command: qs("report-command").value,
    entry: qs("report-entry").value
  };
  const request = buildReportRequest(fields);
  const copying = request.dropped.length ? navigator.clipboard.writeText(request.dropped.map((field) => \`### \${field}
\${fields[field]}\`).join(\`

\`)).then(() => true, () => false) : null;
  window.open(request.url, "_blank", "noopener");
  if (!copying)
    return;
  const names = request.dropped.map((field) => reportFieldNames[field] ?? field).join(t.reportFieldJoiner);
  notify(t.reportTooLong, "error", await copying ? t.reportFieldCopied(names, request.dropped.length) : t.reportFieldLeftOut(names, request.dropped.length));
};
var initActivity = () => {
  on("policy", () => {
    if (activity)
      rerender();
  });
  qs("activity-search").addEventListener("input", (event) => {
    filters.query = event.target.value;
    if (filters.command) {
      filters.command = "";
      renderControls();
    }
    clearTimeout(queryTimer);
    queryTimer = setTimeout(() => {
      renderFeed();
      syncHash();
    }, 120);
  });
  qs("activity-agent").addEventListener("change", (event) => {
    filters.agent = event.target.value;
    renderFeed();
    syncHash();
  });
  qs("activity-days").addEventListener("change", (event) => {
    filters.days = Number(event.target.value);
    loadActivity();
  });
  qs("activity-refresh").addEventListener("click", (event) => {
    runRefresh(event.currentTarget, () => Promise.all([loadOverview(), loadActivity()]));
  });
  qs("report-dialog").addEventListener("close", () => {
    if (qs("report-dialog").returnValue === "report")
      openFalsePositiveForm();
  });
  qs("activity-command-filter").addEventListener("click", (event) => {
    if (!event.target.closest("[data-clear-command]"))
      return;
    filters.command = "";
    rerender();
  });
  qs("activity-decision").addEventListener("click", (event) => {
    const button = event.target.closest("[data-activity-decision]");
    if (!button)
      return;
    filters.decision = button.dataset.activityDecision;
    filters.command = "";
    rerender();
  });
  qs("activity-feed").addEventListener("click", (event) => {
    const target = event.target;
    const showAll = target.closest("[data-activity-decision]");
    if (showAll) {
      filters.decision = showAll.dataset.activityDecision;
      rerender();
      return;
    }
    const summary = target.closest(".feed-summary");
    if (summary) {
      const expanded = summary.getAttribute("aria-expanded") !== "true";
      summary.setAttribute("aria-expanded", String(expanded));
      const detail = qs(summary.getAttribute("aria-controls") ?? "");
      const summaryCommand = summary.querySelector(".feed-command");
      detail.querySelector(".detail-command").hidden = !summaryCommand.textContent?.includes(\`
\`) && summaryCommand.scrollWidth <= summaryCommand.clientWidth;
      detail.hidden = !expanded;
      return;
    }
    const copy = target.closest("[data-log-copy]");
    const copyEntry = renderedEntries[Number(copy?.dataset.logCopy)];
    if (copy && copyEntry) {
      copyText(copy, JSON.stringify(copyEntry, null, 2));
      return;
    }
    const report = renderedEntries[Number(target.closest("[data-report-fp]")?.dataset.reportFp)];
    if (report) {
      openReportDialog(report);
      return;
    }
    const block = renderedEntries[Number(target.closest("[data-block-future]")?.dataset.blockFuture)];
    if (block)
      location.hash = \`rules?compose=\${encodeURIComponent(entryCommand(block))}\`;
  });
};

// src/gui/frontend/project-draft.ts
var clonePolicy = (policy) => JSON.parse(JSON.stringify(policy));
var markedOverrides = (marked, section, overrides) => Object.fromEntries(Object.entries(overrides).filter(([key, value]) => value !== undefined && marked.has(\`\${section}.overrides.\${key}\`)));
var withOverrides = (overrides) => Object.keys(overrides).length > 0 ? { overrides } : {};
var collectProjectProposal = (marked, policy) => {
  const sections = {
    safety: {
      ...marked.has("safety.level") ? { level: policy.safety.level } : {},
      ...withOverrides(markedOverrides(marked, "safety", policy.safety.overrides))
    },
    workflow: marked.has("workflow.worktree_mode") ? { worktree_mode: policy.workflow.worktree_mode } : {},
    destructive_command_protection: {
      ...marked.has("destructive_command_protection.enabled") ? { enabled: policy.destructive_command_protection.enabled } : {},
      ...withOverrides(markedOverrides(marked, "destructive_command_protection", policy.destructive_command_protection.overrides)),
      ...marked.has("destructive_command_protection.allow_paths") ? { allow_paths: policy.destructive_command_protection.allow_paths } : {}
    },
    secret_protection: {
      ...marked.has("secret_protection.enabled") ? { enabled: policy.secret_protection.enabled } : {},
      ...withOverrides(markedOverrides(marked, "secret_protection", policy.secret_protection.overrides)),
      ...marked.has("secret_protection.deny_paths") ? { deny_paths: policy.secret_protection.deny_paths } : {},
      ...marked.has("secret_protection.allow_paths") ? { allow_paths: policy.secret_protection.allow_paths } : {}
    }
  };
  return {
    version: 1,
    ...Object.fromEntries(Object.entries(sections).filter(([, fields]) => Object.keys(fields).length > 0))
  };
};
var projectMarkedFields = (projection) => {
  const destructive = projection.destructive_command_protection ?? {};
  const secret = projection.secret_protection ?? {};
  return [
    ...projection.safety?.level === undefined ? [] : ["safety.level"],
    ...Object.keys(projection.safety?.overrides ?? {}).map((key) => \`safety.overrides.\${key}\`),
    ...projection.workflow?.worktree_mode === undefined ? [] : ["workflow.worktree_mode"],
    ...destructive.enabled === undefined ? [] : ["destructive_command_protection.enabled"],
    ...Object.keys(destructive.overrides ?? {}).map((id) => \`destructive_command_protection.overrides.\${id}\`),
    ...destructive.allow_paths === undefined ? [] : ["destructive_command_protection.allow_paths"],
    ...secret.enabled === undefined ? [] : ["secret_protection.enabled"],
    ...Object.keys(secret.overrides ?? {}).map((id) => \`secret_protection.overrides.\${id}\`),
    ...secret.deny_paths === undefined ? [] : ["secret_protection.deny_paths"],
    ...secret.allow_paths === undefined ? [] : ["secret_protection.allow_paths"]
  ];
};
var overlayProjectProposal = (baseline, proposal) => {
  const displayed = clonePolicy(baseline);
  const destructive = proposal.destructive_command_protection ?? {};
  const secret = proposal.secret_protection ?? {};
  if (proposal.safety?.level)
    displayed.safety.level = proposal.safety.level;
  Object.assign(displayed.safety.overrides, proposal.safety?.overrides ?? {});
  if (proposal.workflow?.worktree_mode !== undefined)
    displayed.workflow.worktree_mode = proposal.workflow.worktree_mode;
  if (destructive.enabled !== undefined)
    displayed.destructive_command_protection.enabled = destructive.enabled;
  Object.assign(displayed.destructive_command_protection.overrides, destructive.overrides ?? {});
  if (destructive.allow_paths)
    displayed.destructive_command_protection.allow_paths = destructive.allow_paths;
  if (secret.enabled !== undefined)
    displayed.secret_protection.enabled = secret.enabled;
  Object.assign(displayed.secret_protection.overrides, secret.overrides ?? {});
  if (secret.deny_paths)
    displayed.secret_protection.deny_paths = secret.deny_paths;
  if (secret.allow_paths)
    displayed.secret_protection.allow_paths = secret.allow_paths;
  return displayed;
};
var seedProjectDraft = (data) => {
  if (!data.baseline)
    return null;
  if (!Array.isArray(data.userPolicyDiagnostics) || data.userPolicyDiagnostics.length > 0)
    return null;
  const marked = new Set(projectMarkedFields(data.projection ?? {}));
  const policy = overlayProjectProposal(data.baseline, data.projection ?? {});
  return {
    baseline: data.baseline,
    marked,
    policy,
    snapshot: JSON.stringify(collectProjectProposal(marked, policy))
  };
};

// src/gui/frontend/shortcuts.ts
var textEntryTags = new Set(["INPUT", "TEXTAREA", "SELECT"]);
var isSearchShortcut = (event, target) => event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !textEntryTags.has(target.tagName) && !target.isContentEditable;

// src/gui/frontend/views/policy.ts
var secretCategoryNames = {
  Basename: t.secretCategoryBasename,
  Pattern: t.secretCategoryPattern,
  "Home path": t.secretCategoryHomePath,
  Variant: t.secretCategoryVariant,
  Extension: t.secretCategoryExtension,
  "Extension pattern": t.secretCategoryExtensionPattern,
  "Coding CLI credential": t.secretCategoryCredential,
  "Coding CLI config": t.secretCategoryConfig
};
var presets = safetyLevels(t);
var capabilities = capabilityNames(t);
var state;
var draftPolicy;
var preview = null;
var previewRequestId = 0;
var testerRequestId = 0;
var projectDraft = null;
var markedFields = new Set;
var busy2 = false;
var showChangedOnly = false;
var groupExpanded = new Map;
var searchQuery = () => qs("policy-search").value.trim().toLowerCase();
var filtering = () => searchQuery() !== "" || showChangedOnly;
var currentFilters = () => ({
  query: qs("policy-search").value,
  changedOnly: showChangedOnly
});
var syncHash2 = () => {
  if (document.body.dataset.view === "policy")
    history.replaceState(null, "", \`#\${policyHash(currentFilters())}\`);
};
var setChangedOnly = (changedOnly) => {
  showChangedOnly = changedOnly;
  document.querySelectorAll("[data-policy-show]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.getAttribute("data-policy-show") === "changed" === changedOnly));
  });
};
var collectFormPolicy = () => ({
  version: 1,
  safety: {
    level: draftPolicy.safety.level,
    overrides: Object.fromEntries(Object.entries(draftPolicy.safety.overrides).filter(([, value]) => typeof value === "boolean"))
  },
  workflow: draftPolicy.workflow,
  destructive_command_protection: draftPolicy.destructive_command_protection,
  secret_protection: {
    enabled: draftPolicy.secret_protection.enabled,
    overrides: draftPolicy.secret_protection.overrides,
    deny_paths: draftPolicy.secret_protection.deny_paths,
    allow_paths: draftPolicy.secret_protection.allow_paths
  },
  audit: draftPolicy.audit
});
var effectivePreviewPolicy = (policy) => {
  const baseline = projectDraft?.baseline;
  if (!baseline)
    return policy;
  const union = (user, project) => [...new Set([...user, ...project])];
  return {
    ...policy,
    destructive_command_protection: {
      ...policy.destructive_command_protection,
      allow_paths: union(baseline.destructive_command_protection.allow_paths, policy.destructive_command_protection.allow_paths)
    },
    secret_protection: {
      ...policy.secret_protection,
      deny_paths: union(baseline.secret_protection.deny_paths, policy.secret_protection.deny_paths),
      allow_paths: union(baseline.secret_protection.allow_paths, policy.secret_protection.allow_paths)
    }
  };
};
var requestPolicyPreview = (policy) => requestJson("/api/policy/preview", { method: "POST", body: JSON.stringify(policy) });
var projectFieldChip = (field) => {
  if (!projectDraft)
    return "";
  if (!markedFields.has(field))
    return \`<span class="project-chip inherited">\${escapeHtml(t.inheritedChip)}</span>\`;
  return \`<button type="button" class="project-chip" data-unmark-field="\${escapeHtml(field)}" title="\${escapeHtml(t.projectChipTitle)}" aria-label="\${escapeHtml(t.projectChipLabel(field))}">\${escapeHtml(t.projectChip)}</button>\`;
};
var projectChipSlots = [
  ["destructive-enabled-chip", "destructive_command_protection.enabled"],
  ["secret-enabled-chip", "secret_protection.enabled"],
  ["allow-paths-chip", "destructive_command_protection.allow_paths"],
  ["deny-paths-chip", "secret_protection.deny_paths"],
  ["secret-allow-paths-chip", "secret_protection.allow_paths"],
  ["safety-level-chip", "safety.level"]
];
var syncProjectChips = () => {
  projectChipSlots.forEach(([id, field]) => {
    qs(id).innerHTML = projectFieldChip(field);
  });
};
var markProjectField = (field) => {
  if (!projectDraft || markedFields.has(field))
    return;
  markedFields.add(field);
  syncProjectChips();
};
var unmarkProjectField = (field) => {
  if (!projectDraft || !markedFields.has(field))
    return;
  markedFields.delete(field);
  draftPolicy = overlayProjectProposal(projectDraft.baseline, collectProjectProposal(markedFields, draftPolicy));
  renderPolicySections();
  refreshPolicyPreview();
};
var markProjectOverride = (section, ruleId) => {
  if (projectDraft)
    markedFields.add(\`\${section}.overrides.\${ruleId}\`);
};
var ruleLabels = () => Object.fromEntries([...state?.destructiveCommandRules ?? [], ...state?.secretPatterns ?? []].map((rule) => [
  rule.id,
  rule.label
]));
var setBanner = () => {
  const saved = state;
  const notices = [
    saved && !saved.policy.destructive_command_protection.enabled ? t.commandProtectionOffBanner : null,
    saved && !saved.policy.secret_protection.enabled ? t.secretProtectionOffBanner : null,
    saved?.configState && saved.configState.state !== "ready" ? t.fallbackConfigBanner(saved.configState.reason) : null
  ].filter((notice) => notice !== null);
  qs("protection-banner").innerHTML = notices.map((notice) => \`<p>\${escapeHtml(notice)}</p>\`).concat(notices.length > 0 && !location.hash.startsWith("#policy") ? [\`<a href="#policy">\${escapeHtml(t.openProtections)}</a>\`] : []).join("");
  qs("protection-banner").hidden = notices.length === 0;
};
var savedComparisonPolicy = () => projectDraft ? overlayProjectProposal(projectDraft.baseline, JSON.parse(projectDraft.snapshot)) : state?.policy;
var renderSavebar = () => {
  qs("policy-savebar").hidden = !shared.dirty;
  qs("save").textContent = projectDraft ? t.reviewAndApply : t.save;
  if (!shared.dirty || !state)
    return;
  const changes = policyChanges(savedComparisonPolicy(), draftPolicy, ruleLabels(), t);
  qs("savebar-title").textContent = changes.length === 0 ? t.unsavedChanges : t.unsavedChangeCount(changes.length);
  qs("savebar-summary").textContent = changes.slice(0, 3).join(t.changeSeparator) + (changes.length > 3 ? t.moreChanges(changes.length - 3) : "");
};
var syncRawFromForm = () => {
  if (state?.errors.length)
    return;
  qs("raw").value = \`\${JSON.stringify(projectDraft ? collectProjectProposal(markedFields, draftPolicy) : collectFormPolicy(), null, 2)}
\`;
  qs("raw-source").textContent = projectDraft ? t.rawProjectFields(projectDraft.path) : t.rawReadOnly;
};
var updateDirtyStatus = () => {
  if (!state || state.errors.length)
    return;
  const wasDirty = shared.dirty;
  if (projectDraft) {
    shared.dirty = JSON.stringify(collectProjectProposal(markedFields, draftPolicy)) !== projectDraft.snapshot;
  }
  if (!projectDraft) {
    const draftJson = JSON.stringify(collectFormPolicy());
    shared.dirty = draftJson !== JSON.stringify(state.policy);
    if (shared.dirty)
      sessionStorage.setItem("cc-safety-net-draft", draftJson);
    if (!shared.dirty)
      sessionStorage.removeItem("cc-safety-net-draft");
  }
  renderSavebar();
  updateActions();
  if (wasDirty !== shared.dirty)
    emit("dirty");
};
var afterEdit = (refreshPreview = true) => {
  syncRawFromForm();
  updateDirtyStatus();
  if (refreshPreview)
    refreshPolicyPreview();
};
var updateActions = () => {
  const hasErrors = (state?.errors.length ?? 0) > 0;
  qs("save").disabled = busy2 || !state || hasErrors;
  qs("repair").disabled = busy2 || !hasErrors;
  qs("reset").disabled = busy2;
  qs("retention-days").disabled = busy2;
};
var runExclusive = async (pendingText, fn) => {
  if (busy2)
    return;
  busy2 = true;
  updateActions();
  notify(pendingText);
  await fn().finally(() => {
    busy2 = false;
    updateActions();
  });
};
var groupRules = (rules) => [...new Set(rules.map((rule) => rule.category))].map((category) => ({
  category,
  rules: rules.filter((rule) => rule.category === category)
}));
var matches = (query, fields) => fields.join(" ").toLowerCase().includes(query);
var secretRuleIsActive = (rule, overrides) => overrides[rule.id] ? overrides[rule.id] === "on" : !rule.defaultOff;
var destructiveChanged = (rule) => draftPolicy.destructive_command_protection.overrides[rule.id] !== undefined || ["rule_override", "capability_override", "environment"].includes(preview?.rules[rule.id]?.source ?? "");
var secretChanged = (rule) => draftPolicy.secret_protection.overrides[rule.id] !== undefined;
var categoryHtml = (options) => {
  const expanded = groupExpanded.get(options.key) ?? filtering();
  const contentId = \`group-\${options.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}\`;
  return \`<section class="rule-group">
    <div class="rule-group-head">
      <button type="button" class="group-toggle" data-group-toggle="\${escapeHtml(options.key)}" aria-expanded="\${expanded}" aria-controls="\${contentId}">
        <span class="chevron" aria-hidden="true"></span>
        <span class="group-title">\${escapeHtml(options.title)}</span>
        <span class="group-counts">\${options.counts}</span>
      </button>
      \${options.bulkSwitch}
    </div>
    <ul class="rule-list" id="\${contentId}" \${expanded ? "" : "hidden"}>\${options.rowsHtml}</ul>
  </section>\`;
};
var ruleRowHtml = (row) => \`<li class="rule-row\${row.disabled ? " row-disabled" : ""}" data-rule-row="\${escapeHtml(row.id)}">
    \${row.control}
    <div class="rule-body">
      <div class="rule-line">\${row.heading}\${row.note ? \`<span class="rule-note \${row.noteTone}">\${escapeHtml(row.note)}</span>\` : ""}\${row.actions}</div>
      \${row.description ? \`<p class="rule-description">\${escapeHtml(row.description)}</p>\` : ""}
    </div>
    \${row.info}
  </li>\`;
var offCount = (off) => off > 0 ? \` · <span class="off-count">\${escapeHtml(t.offCount(off))}</span>\` : "";
var renderDestructiveCommands = () => {
  if (!state || !preview)
    return;
  const effectiveState = preview;
  const query = searchQuery();
  const disabled = !draftPolicy.destructive_command_protection.enabled;
  const catastrophicCount = state.destructiveCommandRules.filter((rule) => rule.catastrophic).length;
  qs("destructive-command-summary").textContent = disabled ? t.commandProtectionOffSummary : t.commandRuleSummary(preview.counts.enabled, preview.counts.disabled, catastrophicCount);
  qs("destructive-panel").classList.toggle("is-off", disabled);
  const visible = state.destructiveCommandRules.filter((rule) => matches(query, [rule.category, rule.label, rule.id, rule.description]) && (!showChangedOnly || destructiveChanged(rule)));
  const rowHtml = (rule) => {
    const info = \`<button type="button" class="info-button" data-rule-example="\${escapeHtml(rule.id)}" aria-label="\${escapeHtml(t.aboutRule(rule.label))}" aria-haspopup="dialog" aria-controls="rule-example-popover">\${icons.info}</button>\`;
    const heading = \`<span class="rule-name">\${escapeHtml(rule.label)}</span><code class="rule-id">\${escapeHtml(rule.id)}</code>\${tierForRule(rule) === "normal" ? "" : \`<span class="tier-badge \${tierForRule(rule)}">\${escapeHtml(tierForRule(rule) === "strict" ? t.presetStrict : t.presetParanoid)}</span>\`}\`;
    if (rule.catastrophic)
      return ruleRowHtml({
        id: rule.id,
        control: \`<span class="lock" title="\${escapeHtml(t.alwaysOn)}">\${icons.lock}</span>\`,
        heading,
        note: null,
        noteTone: "",
        actions: "",
        description: rule.description,
        info,
        disabled: false
      });
    const effective = effectiveState.rules[rule.id];
    if (!effective)
      return "";
    const override = draftPolicy.destructive_command_protection.overrides[rule.id] !== undefined;
    return ruleRowHtml({
      id: rule.id,
      control: \`<input type="checkbox" class="switch" data-destructive-command-active="\${escapeHtml(rule.id)}" \${effective.enabled ? "checked" : ""} \${disabled ? "disabled" : ""} aria-label="\${escapeHtml(rule.label)}">\`,
      heading,
      note: ruleNote(rule, effective, effectiveState.capabilities, t),
      noteTone: effective.source === "rule_override" ? "changed" : effective.source === "capability_override" || effective.source === "environment" ? "" : tierForRule(rule),
      actions: \`\${override ? \`<button type="button" class="quiet small" data-use-inherited="\${escapeHtml(rule.id)}">\${escapeHtml(t.reset)}</button>\` : ""}\${projectFieldChip(\`destructive_command_protection.overrides.\${rule.id}\`)}\`,
      description: rule.description,
      info,
      disabled
    });
  };
  qs("destructive-command-rules").innerHTML = visible.length === 0 ? \`<p class="empty">\${escapeHtml(t.noCommandProtectionMatch)}</p>\` : commandRuleGroups(visible, t).map((group) => {
    const all = commandRuleGroups(state?.destructiveCommandRules ?? [], t).find((entry) => entry.key === group.key)?.rules ?? [];
    const off = all.filter((rule) => effectiveState.rules[rule.id]?.enabled === false).length;
    return categoryHtml({
      key: \`destructive:\${group.key}\`,
      title: group.title,
      counts: group.key === "always-on" ? escapeHtml(\`\${t.ruleCount(all.length)} · \${t.cannotTurnOff}\`) : \`\${escapeHtml(t.ruleCount(all.length))}\${offCount(off)}\`,
      bulkSwitch: "",
      rowsHtml: group.rules.map(rowHtml).join("")
    });
  }).join("");
};
var renderSecretPatterns = () => {
  if (!state)
    return;
  const loaded = state;
  const query = searchQuery();
  const overrides = draftPolicy.secret_protection.overrides;
  const disabled = !draftPolicy.secret_protection.enabled;
  const offTotal = loaded.secretPatterns.filter((rule) => !secretRuleIsActive(rule, overrides)).length;
  qs("secret-summary").textContent = disabled ? t.secretProtectionOffSummary : t.secretRuleSummary(loaded.secretPatterns.length - offTotal, offTotal);
  qs("secret-panel").classList.toggle("is-off", disabled);
  const visible = loaded.secretPatterns.filter((rule) => matches(query, [
    rule.category,
    secretCategoryNames[rule.category],
    rule.label,
    rule.id,
    rule.description,
    ...rule.paths ?? []
  ]) && (!showChangedOnly || secretChanged(rule)));
  const rowHtml = (rule) => {
    const active = secretRuleIsActive(rule, overrides);
    const override = overrides[rule.id] !== undefined;
    return ruleRowHtml({
      id: rule.id,
      control: \`<input type="checkbox" class="switch" data-secret-active="\${escapeHtml(rule.id)}" \${active ? "checked" : ""} \${disabled ? "disabled" : ""} aria-label="\${escapeHtml(rule.label)}">\`,
      heading: \`<span class="rule-name">\${escapeHtml(rule.label)}</span>\`,
      note: override ? t.changedByYou : rule.defaultOff ? t.offByDefault : null,
      noteTone: override ? "changed" : "",
      actions: \`\${override ? \`<button type="button" class="quiet small" data-secret-reset="\${escapeHtml(rule.id)}">\${escapeHtml(t.reset)}</button>\` : ""}\${projectFieldChip(\`secret_protection.overrides.\${rule.id}\`)}\`,
      description: rule.description ?? (rule.paths ? t.pathCount(rule.paths.length) : ""),
      info: rule.paths ? \`<button type="button" class="info-button" data-secret-paths="\${escapeHtml(rule.id)}" aria-label="\${escapeHtml(t.protectedPathsFor(rule.label))}" aria-haspopup="dialog" aria-controls="rule-example-popover">\${icons.info}</button>\` : '<span class="info-spacer"></span>',
      disabled
    });
  };
  qs("secret-patterns").innerHTML = visible.length === 0 ? \`<p class="empty">\${escapeHtml(t.noSecretProtectionMatch)}</p>\` : groupRules(visible).map((group) => {
    const all = loaded.secretPatterns.filter((rule) => rule.category === group.category);
    const on = all.filter((rule) => secretRuleIsActive(rule, overrides)).length;
    const title = secretCategoryNames[group.category] ?? group.category;
    return categoryHtml({
      key: \`secret:\${group.category}\`,
      title,
      counts: \`\${escapeHtml(t.ruleCount(all.length))}\${offCount(on === 0 ? 0 : all.length - on)}\`,
      bulkSwitch: \`<input type="checkbox" class="switch" data-secret-group-active="\${escapeHtml(group.category)}" \${on > 0 ? "checked" : ""} \${disabled ? "disabled" : ""} aria-label="\${escapeHtml(t.toggleGroup(title))}" title="\${escapeHtml(t.toggleAll)}">\`,
      rowsHtml: group.rules.map(rowHtml).join("")
    });
  }).join("");
};
var renderChangedCount = () => {
  if (!state)
    return;
  const changed = state.destructiveCommandRules.filter((rule) => !rule.catastrophic && destructiveChanged(rule)).length + state.secretPatterns.filter(secretChanged).length;
  qs("changed-count").textContent = changed > 0 ? String(changed) : "";
};
var renderRules = () => {
  renderDestructiveCommands();
  renderSecretPatterns();
  renderChangedCount();
};
var renderSafety = () => {
  const environmentSources = preview ? [
    ...new Set(Object.values(preview.capabilities).filter((capability) => capability.source === "environment").flatMap((capability) => capability.sources.filter((source) => source.startsWith("env "))))
  ] : [];
  qs("environment-overrides").hidden = environmentSources.length === 0;
  qs("environment-overrides").textContent = environmentSources.length ? t.environmentRaises(environmentSources.map((source) => source.slice(4)).join(", ")) : "";
  qs("safety-level").innerHTML = Object.entries(presets).map(([level, meta]) => \`<label class="preset-card preset-\${level}"><input type="radio" name="safety-level" value="\${level}" \${draftPolicy.safety.level === level ? "checked" : ""}><span class="preset-name">\${escapeHtml(meta[0])}</span><span class="preset-description">\${escapeHtml(meta[1])}</span></label>\`).join("");
  const inherited = SAFETY_LEVEL_CAPABILITIES[draftPolicy.safety.level];
  qs("safety-overrides").innerHTML = Object.entries(capabilities).map(([key, meta]) => {
    const value = draftPolicy.safety.overrides[key];
    return \`<div class="setting-row"><label class="setting-text" for="override-\${key}"><strong>\${escapeHtml(meta[0])}</strong><small>\${escapeHtml(meta[1])}</small></label>\${projectFieldChip(\`safety.overrides.\${key}\`)}<select id="override-\${key}" data-safety-override="\${key}">
      <option value="inherit" \${value === undefined ? "selected" : ""}>\${escapeHtml(t.fromPresetOption(inherited[key]))}</option>
      <option value="true" \${value === true ? "selected" : ""}>\${escapeHtml(t.alwaysOn)}</option>
      <option value="false" \${value === false ? "selected" : ""}>\${escapeHtml(t.alwaysOff)}</option>
    </select></div>\`;
  }).join("");
  qs("workflow").innerHTML = \`<div class="setting-row"><label class="setting-text" for="workflow-worktree"><strong>\${escapeHtml(t.worktreeDiscard)}</strong><small>\${escapeHtml(t.worktreeDiscardHelp)}</small></label>\${projectFieldChip("workflow.worktree_mode")}<input type="checkbox" class="switch" id="workflow-worktree" data-workflow-worktree \${draftPolicy.workflow.worktree_mode ? "checked" : ""}></div>\`;
  const customized = (preview?.counts.effectiveCustomizations ?? 0) > 0 || Object.entries(draftPolicy.safety.overrides).some(([key, value]) => value !== SAFETY_LEVEL_CAPABILITIES[draftPolicy.safety.level][key]);
  qs("safety-preset-status").textContent = customized ? t.presetCustomized(levelName(draftPolicy.safety.level, t)) : "";
};
var showRulePopover = (button, options) => {
  const popover = qs("rule-example-popover");
  qs("rule-example-label").textContent = options.label;
  qs("rule-example-title").textContent = options.title;
  qs("rule-example-description").textContent = options.description;
  qs("rule-example-description").hidden = options.description === "";
  qs("rule-example-command").textContent = options.body;
  if (!popover.matches(":popover-open"))
    popover.showPopover();
  const buttonRect = button.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const below = buttonRect.bottom + 8;
  popover.style.top = \`\${below + popoverRect.height <= window.innerHeight - 12 ? below : Math.max(12, buttonRect.top - 8 - popoverRect.height)}px\`;
  popover.style.left = \`\${Math.min(window.innerWidth - popoverRect.width - 12, Math.max(12, buttonRect.right - popoverRect.width))}px\`;
};
var validatePathAdditions = async (patch) => {
  const candidate = collectFormPolicy();
  patch(candidate);
  const result = await requestPolicyPreview(candidate);
  return result.ok && result.data?.preview ? null : errorText(result);
};
var createPathList = (prefix, config) => {
  const setHint = (text) => {
    qs(\`\${prefix}-hint\`).textContent = text;
    qs(\`\${prefix}-hint\`).hidden = !text;
  };
  const render = () => {
    const paths = config.getPaths();
    const disabled = config.isDisabled();
    qs(\`\${prefix}-count\`).textContent = paths.length > 0 ? String(paths.length) : "";
    qs(\`\${prefix}-input\`).disabled = disabled;
    qs(\`\${prefix}-add-button\`).disabled = disabled;
    qs(\`\${prefix}-list\`).innerHTML = paths.map((path, index) => \`<li class="path-item\${disabled ? " row-disabled" : ""}">
          <code>\${escapeHtml(path)}</code>
          <button type="button" class="quiet icon-only" data-path-list="\${prefix}" data-path-remove="\${index}" \${disabled ? "disabled" : ""} aria-label="\${escapeHtml(t.removePath(path))}">\${icons.remove}</button>
        </li>\`).join("");
  };
  const claimForProject = () => {
    if (!projectDraft || markedFields.has(config.field))
      return;
    markedFields.add(config.field);
    config.setPaths([]);
    syncProjectChips();
  };
  let adding = false;
  const add = async (value) => {
    if (adding)
      return;
    const entries = [
      ...new Set(value.split(\`
\`).map((line) => line.trim()).filter(Boolean))
    ];
    if (entries.length === 0)
      return;
    const scope = projectDraft;
    const claimed = projectDraft !== null && !markedFields.has(config.field);
    const previousPaths = config.getPaths();
    claimForProject();
    const submitted = qs(\`\${prefix}-input\`).value;
    const additions = entries.filter((entry) => !config.getPaths().includes(entry));
    if (additions.length) {
      adding = true;
      const error = await validatePathAdditions((candidate) => config.patch(candidate, [...config.getPaths(), ...additions])).finally(() => {
        adding = false;
      });
      if (projectDraft !== scope)
        return;
      if (error) {
        setHint(t.notAdded(additions.join(", "), error));
        if (claimed) {
          markedFields.delete(config.field);
          config.setPaths(previousPaths);
          syncProjectChips();
        }
        return;
      }
    }
    const current = config.getPaths();
    const duplicates = entries.filter((entry) => current.includes(entry));
    config.setPaths([...current, ...additions.filter((entry) => !current.includes(entry))]);
    if (qs(\`\${prefix}-input\`).value === submitted)
      qs(\`\${prefix}-input\`).value = "";
    setHint(duplicates.length ? t.alreadyListed(duplicates.join(", ")) : "");
    render();
    afterEdit(false);
    qs(\`\${prefix}-input\`).focus();
  };
  const remove = (index) => {
    claimForProject();
    config.setPaths(config.getPaths().filter((_, position) => position !== index));
    setHint("");
    render();
    afterEdit(false);
  };
  return { render, add, remove };
};
var pathLists = {
  "allow-paths": createPathList("allow-paths", {
    field: "destructive_command_protection.allow_paths",
    getPaths: () => draftPolicy.destructive_command_protection.allow_paths,
    setPaths: (paths) => {
      draftPolicy.destructive_command_protection.allow_paths = paths;
    },
    isDisabled: () => !draftPolicy.destructive_command_protection.enabled,
    patch: (candidate, paths) => {
      candidate.destructive_command_protection = {
        ...candidate.destructive_command_protection,
        allow_paths: paths
      };
    }
  }),
  "deny-paths": createPathList("deny-paths", {
    field: "secret_protection.deny_paths",
    getPaths: () => draftPolicy.secret_protection.deny_paths,
    setPaths: (paths) => {
      draftPolicy.secret_protection.deny_paths = paths;
    },
    isDisabled: () => !draftPolicy.secret_protection.enabled,
    patch: (candidate, paths) => {
      candidate.secret_protection = { ...candidate.secret_protection, deny_paths: paths };
    }
  }),
  "secret-allow-paths": createPathList("secret-allow-paths", {
    field: "secret_protection.allow_paths",
    getPaths: () => draftPolicy.secret_protection.allow_paths,
    setPaths: (paths) => {
      draftPolicy.secret_protection.allow_paths = paths;
    },
    isDisabled: () => !draftPolicy.secret_protection.enabled,
    patch: (candidate, paths) => {
      candidate.secret_protection = { ...candidate.secret_protection, allow_paths: paths };
    }
  })
};
var pathListFor = (name) => name === "deny-paths" || name === "allow-paths" || name === "secret-allow-paths" ? pathLists[name] : null;
var renderPathLists = () => {
  Object.values(pathLists).forEach((list) => {
    list.render();
  });
};
var syncMasterSwitches = () => {
  qs("destructive-enabled").checked = draftPolicy.destructive_command_protection.enabled;
  qs("secret-enabled").checked = draftPolicy.secret_protection.enabled;
};
function renderPolicySections() {
  syncMasterSwitches();
  renderSafety();
  renderRules();
  renderPathLists();
  syncProjectChips();
  syncRawFromForm();
  updateDirtyStatus();
}
var refreshPolicyPreview = async () => {
  const requestId = ++previewRequestId;
  const result = await requestPolicyPreview(effectivePreviewPolicy(collectFormPolicy()));
  if (requestId !== previewRequestId)
    return;
  if (!result.ok || !result.data?.preview) {
    notify(t.previewFailed, "error", errorText(result));
    return;
  }
  preview = result.data.preview;
  renderSafety();
  renderRules();
  runCommandTest();
};
var runCommandTest = async () => {
  const command = qs("tester-input").value.trim();
  if (!command) {
    qs("tester-result").hidden = true;
    return;
  }
  const requestId = ++testerRequestId;
  const result = await requestJson("/api/policy/explain", {
    method: "POST",
    body: JSON.stringify({ command, policy: effectivePreviewPolicy(collectFormPolicy()) })
  });
  if (requestId !== testerRequestId)
    return;
  const el = qs("tester-result");
  el.hidden = false;
  if (!result.ok) {
    el.className = "notice error";
    el.textContent = t.couldNotTest(errorText(result));
    return;
  }
  if (result.data.result === "allowed") {
    el.className = "notice ok";
    el.innerHTML = \`\${t.testerAllowed} <a href="#rules?compose=\${encodeURIComponent(command)}">\${escapeHtml(t.createRuleToBlock)}</a>\`;
    return;
  }
  const ruleId = result.data.customRule?.id ?? result.data.ruleId;
  const ruleHtml = !ruleId ? "" : result.data.customRule ? \`<a class="rule-id" href="#rules?focus=\${encodeURIComponent(ruleId)}">\${escapeHtml(ruleId)}</a>\` : \`<a class="rule-id" href="#policy?q=\${encodeURIComponent(ruleId)}">\${escapeHtml(ruleId)}</a>\`;
  el.className = "notice error";
  el.innerHTML = \`\${t.testerBlocked(ruleHtml)} \${escapeHtml(result.data.reason || "")}\${result.data.segment && result.data.segment !== command ? \`<div class="tester-segment">\${escapeHtml(t.blockedPart)} <code>\${escapeHtml(result.data.segment)}</code></div>\` : ""}\`;
};
var render2 = () => {
  if (!state)
    return;
  const loaded = state;
  draftPolicy = clonePolicy(loaded.policy);
  preview = loaded.preview;
  shared.dirty = false;
  qs("policy-savebar").hidden = true;
  showPath("policy-path", loaded.path, loaded.exists ? "" : t.notCreatedYet);
  const projectPolicy = loaded.projectPolicy;
  qs("project-policy-row").hidden = !projectPolicy;
  showPath("project-policy-path", projectPolicy?.path ?? "");
  qs("project-policy-notice").hidden = !projectPolicy || projectPolicy.weakenings.length === 0;
  qs("project-policy-notice").textContent = projectPolicy ? [t.projectPolicyChanges, ...projectPolicy.weakenings].join(\`
\`) : "";
  qs("app-version").textContent = loaded.version;
  qs("raw").value = loaded.errors.length ? loaded.raw : \`\${JSON.stringify(draftPolicy, null, 2)}
\`;
  qs("recovery").hidden = loaded.errors.length === 0;
  qs("policy-errors").textContent = loaded.errors.join(\`
\`);
  syncMasterSwitches();
  renderSafety();
  renderRules();
  renderPathLists();
  syncProjectChips();
  syncRawFromForm();
  if (loaded.errors.length)
    qs("raw-source").textContent = t.rawOnDisk;
  updateActions();
  setBanner();
  emit("dirty");
  emit("policy");
  if (loaded.errors.length && !location.hash.startsWith("#policy"))
    location.hash = "policy";
};
var restoreDraft = () => {
  if (!state || state.errors.length)
    return;
  const stored = sessionStorage.getItem("cc-safety-net-draft");
  if (!stored)
    return;
  const parsed = (() => {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  })();
  const isRecordField = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  const isOptionalPathList = (value) => value === undefined || Array.isArray(value) && value.every((item) => typeof item === "string");
  const isPolicyShape = isRecordField(parsed) && isRecordField(parsed.safety) && typeof parsed.safety.level === "string" && Object.hasOwn(presets, parsed.safety.level) && isRecordField(parsed.safety.overrides) && isRecordField(parsed.workflow) && isRecordField(parsed.destructive_command_protection) && isRecordField(parsed.destructive_command_protection.overrides) && isOptionalPathList(parsed.destructive_command_protection.allow_paths) && isRecordField(parsed.secret_protection) && isRecordField(parsed.secret_protection.overrides) && isOptionalPathList(parsed.secret_protection.deny_paths) && isOptionalPathList(parsed.secret_protection.allow_paths) && isRecordField(parsed.audit);
  if (!isPolicyShape || stored === JSON.stringify(state.policy)) {
    sessionStorage.removeItem("cc-safety-net-draft");
    return;
  }
  const draft = parsed;
  draft.destructive_command_protection.allow_paths ??= [];
  draft.secret_protection.deny_paths ??= [];
  draft.secret_protection.allow_paths ??= [];
  draftPolicy = draft;
  renderPolicySections();
  refreshPolicyPreview();
  notify(t.restoredDraft, "ok");
};
var loadPolicy = async () => {
  const result = await requestJson("/api/policy");
  if (!result.ok || !result.data) {
    notify(t.couldNotLoadPolicy, "error", errorText(result));
    return false;
  }
  state = result.data;
  shared.policy = state;
  render2();
  restoreDraft();
  if (state.errors.length)
    notify(t.statusRepair, "error");
  return true;
};
var writePolicy = async (path, body, failureTitle) => {
  const result = await requestJson(path, { method: "POST", body });
  if (isWriteSuccess(result))
    return result;
  notify(failureTitle, "error", errorText(result));
  return null;
};
var reloadAfterWrite = async () => {
  sessionStorage.removeItem("cc-safety-net-draft");
  return loadPolicy();
};
var renderProjectDraftBar = () => {
  shared.drafting = projectDraft !== null;
  qs("scope-user").setAttribute("aria-pressed", String(projectDraft === null));
  qs("project-draft-enter").setAttribute("aria-pressed", String(projectDraft !== null));
  qs("project-draft-bar").hidden = projectDraft === null;
  qs("save").textContent = projectDraft ? t.reviewAndApply : t.save;
  if (!projectDraft)
    return;
  qs("project-draft-path").textContent = projectDraft.path;
  qs("project-draft-change").hidden = !projectDraft.canPickDirectory;
};
var setProjectDraftDiagnostics = (messages) => {
  qs("project-draft-diagnostics").textContent = messages.join(\`
\`);
  qs("project-draft-diagnostics").hidden = messages.length === 0;
};
var exitProjectDraft = () => {
  projectDraft = null;
  markedFields = new Set;
  setProjectDraftDiagnostics([]);
  if (state)
    draftPolicy = clonePolicy(state.policy);
  renderProjectDraftBar();
  renderPolicySections();
};
var ingestProjectState = async (okStatus) => {
  const result = await requestJson("/api/policy/project");
  if (!result.ok || !result.data) {
    notify(t.projectPolicyUnavailable, "error", errorText(result));
    return false;
  }
  const seeded = seedProjectDraft(result.data);
  if (!seeded) {
    exitProjectDraft();
    await loadPolicy();
    notify(t.repairFirst, "error", [
      t.repairBeforeProject,
      ...Array.isArray(result.data.userPolicyDiagnostics) ? result.data.userPolicyDiagnostics : []
    ].join(\`
\`));
    return false;
  }
  projectDraft = {
    path: result.data.path,
    revision: result.data.revision,
    canPickDirectory: result.data.canPickDirectory === true,
    baseline: seeded.baseline,
    snapshot: seeded.snapshot
  };
  markedFields = seeded.marked;
  draftPolicy = seeded.policy;
  setProjectDraftDiagnostics(Array.isArray(result.data.projectionDiagnostics) ? result.data.projectionDiagnostics : []);
  renderProjectDraftBar();
  renderPolicySections();
  refreshPolicyPreview();
  notify(okStatus, "ok");
  return true;
};
var enterProjectDraft = async () => {
  if (projectDraft)
    return;
  if (!state) {
    notify(t.policyNotLoaded, "error", t.reloadPage);
    return;
  }
  if (state.errors.length) {
    notify(t.repairFirst, "error");
    return;
  }
  if (shared.dirty) {
    if (!await confirmDialog({
      title: t.discardUnsavedTitle,
      body: t.discardBeforeProject,
      confirmLabel: t.discardChanges,
      confirmClass: ""
    }))
      return;
    sessionStorage.removeItem("cc-safety-net-draft");
    if (!await loadPolicy())
      return;
  }
  await ingestProjectState(t.editingProjectPolicy);
};
var confirmDiscardProjectDraft = async (body) => !shared.dirty || await confirmDialog({
  title: t.discardDraftTitle,
  body,
  confirmLabel: t.discardDraft,
  confirmClass: ""
});
var changeProjectDirectory = async () => {
  if (!await confirmDiscardProjectDraft(t.switchFolderDiscards))
    return;
  const result = await requestJson("/api/policy/project/choose-directory", { method: "POST" });
  if (!result.ok) {
    notify(t.folderPickerFailed, "error", errorText(result));
    return;
  }
  if (result.data.error) {
    notify(result.data.error, "error");
    return;
  }
  if (result.data.cancelled)
    return;
  await ingestProjectState(t.editingProjectPolicy);
};
var leaveProjectDraft = async () => {
  if (!projectDraft)
    return;
  if (!await confirmDiscardProjectDraft(t.projectChangesUnwritten))
    return;
  exitProjectDraft();
  if (await loadPolicy())
    notify(t.backToOwnPolicy, "ok");
};
var discardProjectDraft = async (draft) => {
  if (!await confirmDialog({
    title: t.discardDraftChangesTitle,
    body: t.discardDraftChangesBody,
    confirmLabel: t.discardChanges,
    confirmClass: ""
  }))
    return;
  const snapshot = JSON.parse(draft.snapshot);
  markedFields = new Set(projectMarkedFields(snapshot));
  draftPolicy = overlayProjectProposal(draft.baseline, snapshot);
  renderPolicySections();
  refreshPolicyPreview();
  notify(t.changesDiscarded, "ok");
};
var handleStaleProjectDraft = async () => {
  if (!await ingestProjectState(t.projectDraftReloaded))
    return;
  notify(t.projectFolderChanged, "error", t.projectFolderChangedBody);
};
var projectDiffHtml = (data) => {
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const warnings = [
    ...data.existingFileDiagnostics?.length ? [t.invalidProjectFile] : [],
    ...data.weakenings ?? []
  ];
  return (rows.length === 0 ? \`<p class="empty">\${escapeHtml(t.noEffectiveChange)}</p>\` : \`<table class="diff-table"><thead><tr><th>\${escapeHtml(t.diffSetting)}</th><th>\${escapeHtml(t.diffNow)}</th><th>\${escapeHtml(t.diffAfter)}</th></tr></thead><tbody>\${rows.map((row) => \`<tr><td><code>\${escapeHtml(row.field)}</code></td><td class="diff-before">\${escapeHtml(row.before ?? t.unset)}</td><td class="diff-after">\${escapeHtml(row.after ?? t.unset)}</td></tr>\`).join("")}</tbody></table>\`) + warnings.map((text) => \`<p class="notice warn">\${escapeHtml(text)}</p>\`).join("");
};
var reviewProjectDraft = async (draft) => {
  const proposal = collectProjectProposal(markedFields, draftPolicy);
  const serialized = JSON.stringify(proposal);
  const body = JSON.stringify({ revision: draft.revision, proposal });
  const diff = await requestJson("/api/policy/project/diff", { method: "POST", body });
  if (projectDraft !== draft)
    return;
  if (diff.status === 409) {
    await handleStaleProjectDraft();
    return;
  }
  if (!diff.ok) {
    notify(t.reviewFailed, "error", errorText(diff));
    return;
  }
  if (JSON.stringify(collectProjectProposal(markedFields, draftPolicy)) !== serialized) {
    notify(t.reviewAgain, "error", t.draftChangedDuringReview);
    return;
  }
  if (!await confirmDialog({
    title: t.applyProjectTitle,
    body: t.applyProjectBody,
    detail: draft.path,
    rowsHtml: projectDiffHtml(diff.data),
    confirmLabel: t.applyProject,
    confirmClass: "primary"
  }))
    return;
  await runExclusive(t.applyingStatus, async () => {
    const applied = await requestJson("/api/policy/project/apply", { method: "POST", body });
    if (applied.status === 409) {
      await handleStaleProjectDraft();
      return;
    }
    if (!isWriteSuccess(applied)) {
      notify(t.applyFailed, "error", errorText(applied));
      return;
    }
    exitProjectDraft();
    if (await loadPolicy())
      notify(t.projectApplied, "ok", applied.data.path);
  });
};
var save = () => {
  if (!state) {
    notify(t.policyNotLoaded, "error", t.reloadPage);
    return;
  }
  if (state.errors.length) {
    notify(t.repairBeforeSaving, "error");
    return;
  }
  if (projectDraft) {
    reviewProjectDraft(projectDraft);
    return;
  }
  if (!shared.dirty)
    return;
  const policy = collectFormPolicy();
  runExclusive(t.savingStatus, async () => {
    const result = await writePolicy("/api/policy", JSON.stringify(policy), t.saveFailed);
    if (result && await reloadAfterWrite())
      notify(t.policySaved, "ok", result.data.path);
  });
};
var discard = async () => {
  if (projectDraft) {
    await discardProjectDraft(projectDraft);
    return;
  }
  if (!await confirmDialog({
    title: t.discardUnsavedTitle,
    body: t.discardUnsavedBody,
    confirmLabel: t.discardChanges,
    confirmClass: ""
  }))
    return;
  await runExclusive(t.discardingStatus, async () => {
    sessionStorage.removeItem("cc-safety-net-draft");
    if (await loadPolicy())
      notify(t.changesDiscarded, "ok");
  });
};
var repair = async () => {
  if (!state?.errors.length)
    return;
  if (!await confirmDialog({
    title: t.repairTitle,
    body: t.repairBody,
    detail: state.path,
    confirmLabel: t.repair,
    confirmClass: "primary"
  }))
    return;
  await runExclusive(t.repairingStatus, async () => {
    const result = await writePolicy("/api/repair", "{}", t.repairFailed);
    if (result && await reloadAfterWrite())
      notify(t.policyRepaired, "ok", result.data.path);
  });
};
var resetOverrides = async (section) => {
  if (Object.keys(draftPolicy[section].overrides).length === 0) {
    notify(t.nothingToReset, "ok");
    return;
  }
  if (!await confirmDialog({
    title: t.resetRulesTitle,
    body: t.resetRulesBody(section === "secret_protection"),
    confirmLabel: t.resetRules
  }))
    return;
  markedFields = new Set([...markedFields].filter((field) => !field.startsWith(\`\${section}.overrides.\`)));
  if (projectDraft) {
    draftPolicy = overlayProjectProposal(projectDraft.baseline, collectProjectProposal(markedFields, draftPolicy));
    renderPolicySections();
    refreshPolicyPreview();
    return;
  }
  draftPolicy[section].overrides = {};
  renderRules();
  afterEdit();
};
var setDestructiveOverride = (ruleId, active) => {
  if (!projectDraft && active === preview?.rules[ruleId]?.inheritedEnabled) {
    delete draftPolicy.destructive_command_protection.overrides[ruleId];
    return;
  }
  draftPolicy.destructive_command_protection.overrides[ruleId] = active ? "on" : "off";
  markProjectOverride("destructive_command_protection", ruleId);
};
var setSecretOverride = (rule, active) => {
  if (!projectDraft && active === !rule.defaultOff) {
    delete draftPolicy.secret_protection.overrides[rule.id];
    return;
  }
  draftPolicy.secret_protection.overrides[rule.id] = active ? "on" : "off";
  markProjectOverride("secret_protection", rule.id);
};
var toggleProtection = async (input) => {
  const secret = input.id === "secret-enabled";
  if (!input.checked && !await confirmDialog({
    title: secret ? t.turnOffSecretTitle : t.turnOffCommandTitle,
    body: secret ? t.turnOffSecretBody : t.turnOffCommandBody,
    detail: secret ? undefined : t.catastrophicStillApply,
    confirmLabel: t.turnOff
  })) {
    input.checked = true;
    return;
  }
  if (secret)
    draftPolicy.secret_protection.enabled = input.checked;
  if (!secret)
    draftPolicy.destructive_command_protection.enabled = input.checked;
  markProjectField(secret ? "secret_protection.enabled" : "destructive_command_protection.enabled");
  renderRules();
  renderPathLists();
  afterEdit(!secret);
};
var handleChange = (control) => {
  if (control.name === "safety-level") {
    draftPolicy.safety.level = control.value;
    markProjectField("safety.level");
    renderSafety();
    afterEdit();
    return;
  }
  if (control.dataset.safetyOverride) {
    const capability = control.dataset.safetyOverride;
    if (control.value === "inherit" && !projectDraft)
      delete draftPolicy.safety.overrides[capability];
    if (control.value !== "inherit")
      draftPolicy.safety.overrides[capability] = control.value === "true";
    if (control.value === "inherit")
      unmarkProjectField(\`safety.overrides.\${capability}\`);
    if (control.value !== "inherit")
      markProjectField(\`safety.overrides.\${capability}\`);
    afterEdit();
    return;
  }
  if (!(control instanceof HTMLInputElement))
    return;
  if ("workflowWorktree" in control.dataset) {
    draftPolicy.workflow.worktree_mode = control.checked;
    markProjectField("workflow.worktree_mode");
    afterEdit(false);
    return;
  }
  if (control.id === "destructive-enabled" || control.id === "secret-enabled") {
    toggleProtection(control);
    return;
  }
  const destructiveId = control.dataset.destructiveCommandActive;
  if (destructiveId) {
    setDestructiveOverride(destructiveId, control.checked);
    afterEdit();
    return;
  }
  const secretGroup = control.dataset.secretGroupActive;
  if (secretGroup) {
    state?.secretPatterns.filter((rule) => rule.category === secretGroup).forEach((rule) => {
      setSecretOverride(rule, control.checked);
    });
    renderRules();
    afterEdit(false);
    return;
  }
  const secretRule = state?.secretPatterns.find((rule) => rule.id === control.dataset.secretActive);
  if (secretRule) {
    setSecretOverride(secretRule, control.checked);
    renderRules();
    afterEdit(false);
  }
};
var handleClick = (target) => {
  const unmark = target.closest("[data-unmark-field]");
  if (unmark) {
    unmarkProjectField(unmark.dataset.unmarkField ?? "");
    return;
  }
  const groupToggle = target.closest("[data-group-toggle]");
  if (groupToggle) {
    groupExpanded.set(groupToggle.dataset.groupToggle ?? "", groupToggle.getAttribute("aria-expanded") !== "true");
    renderRules();
    return;
  }
  const show = target.closest("[data-policy-show]");
  if (show) {
    setChangedOnly(show.dataset.policyShow === "changed");
    groupExpanded.clear();
    renderRules();
    syncHash2();
    return;
  }
  const example = state?.destructiveCommandRules.find((rule) => rule.id === target.closest("[data-rule-example]")?.dataset.ruleExample);
  if (example) {
    showRulePopover(target.closest("[data-rule-example]"), {
      label: example.catastrophic ? t.alwaysOn : example.category,
      title: example.label,
      description: example.description,
      body: example.example
    });
    return;
  }
  const secretPaths = state?.secretPatterns.find((rule) => rule.id === target.closest("[data-secret-paths]")?.dataset.secretPaths);
  if (secretPaths?.paths) {
    showRulePopover(target.closest("[data-secret-paths]"), {
      label: t.protectedPaths,
      title: secretPaths.label,
      description: "",
      body: secretPaths.paths.join(\`
\`)
    });
    return;
  }
  const inherited = target.closest("[data-use-inherited]");
  if (inherited) {
    const ruleId = inherited.dataset.useInherited ?? "";
    if (projectDraft) {
      unmarkProjectField(\`destructive_command_protection.overrides.\${ruleId}\`);
      return;
    }
    delete draftPolicy.destructive_command_protection.overrides[ruleId];
    afterEdit();
    return;
  }
  const secretReset = target.closest("[data-secret-reset]");
  if (secretReset) {
    const ruleId = secretReset.dataset.secretReset ?? "";
    if (projectDraft) {
      unmarkProjectField(\`secret_protection.overrides.\${ruleId}\`);
      return;
    }
    delete draftPolicy.secret_protection.overrides[ruleId];
    renderRules();
    afterEdit(false);
    return;
  }
  const addButton = target.closest("[data-path-add]");
  if (addButton) {
    pathListFor(addButton.dataset.pathAdd)?.add(qs(\`\${addButton.dataset.pathAdd}-input\`).value);
    return;
  }
  const removeButton = target.closest("[data-path-remove]");
  if (removeButton)
    pathListFor(removeButton.dataset.pathList)?.remove(Number(removeButton.dataset.pathRemove));
};
var showPolicy = (params) => {
  const next = policyFiltersFromParams(params);
  if (policyHash(next) !== policyHash(currentFilters())) {
    qs("policy-search").value = next.query;
    setChangedOnly(next.changedOnly);
    groupExpanded.clear();
    renderRules();
  }
  if (!next.query)
    return;
  document.querySelector(\`[data-rule-row="\${CSS.escape(next.query)}"]\`)?.scrollIntoView({ block: "center" });
};
var setRawCopyLabel = () => {
  qs("raw-copy").innerHTML = \`\${icons.copy}<span>\${escapeHtml(t.copy)}</span>\`;
};
var initPolicy = () => {
  setRawCopyLabel();
  const view = qs("policy-search").closest("[data-view]");
  view.addEventListener("change", (event) => {
    const control = event.target;
    if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement)
      handleChange(control);
  });
  view.addEventListener("click", (event) => {
    if (event.target instanceof Element)
      handleClick(event.target);
  });
  document.addEventListener("keydown", (event) => {
    if (view.hidden || document.querySelector("dialog[open]"))
      return;
    if (!(event.target instanceof HTMLElement) || !isSearchShortcut(event, event.target))
      return;
    event.preventDefault();
    qs("policy-search").focus();
  });
  qs("policy-search").addEventListener("input", () => {
    groupExpanded.clear();
    renderRules();
    syncHash2();
  });
  view.addEventListener("keydown", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || event.key !== "Enter")
      return;
    const list = pathListFor(input.dataset.pathInput);
    if (!list)
      return;
    event.preventDefault();
    list.add(input.value);
  });
  view.addEventListener("paste", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement))
      return;
    const list = pathListFor(input.dataset.pathInput);
    const text = event.clipboardData?.getData("text") ?? "";
    if (!list || !text.includes(\`
\`))
      return;
    event.preventDefault();
    list.add(\`\${input.value}
\${text}\`);
  });
  const testerDialog = qs("tester-dialog");
  qs("tester-open").addEventListener("click", () => {
    testerDialog.showModal();
    qs("tester-input").select();
    runCommandTest();
  });
  qs("tester-form").addEventListener("submit", (event) => {
    event.preventDefault();
    runCommandTest();
  });
  qs("tester-close").addEventListener("click", () => testerDialog.close());
  qs("tester-result").addEventListener("click", (event) => {
    if (event.target.closest("a"))
      testerDialog.close();
  });
  qs("scope-user").addEventListener("click", () => {
    leaveProjectDraft();
  });
  qs("project-draft-enter").addEventListener("click", () => {
    enterProjectDraft();
  });
  qs("project-draft-change").addEventListener("click", () => {
    changeProjectDirectory();
  });
  qs("reset-rule-customizations").addEventListener("click", () => {
    resetOverrides("destructive_command_protection");
  });
  qs("reset-secret-customizations").addEventListener("click", () => {
    resetOverrides("secret_protection");
  });
  qs("save").addEventListener("click", save);
  qs("discard-changes").addEventListener("click", () => {
    discard();
  });
  qs("repair").addEventListener("click", () => {
    repair();
  });
  qs("raw-copy").addEventListener("click", (event) => {
    copyText(event.currentTarget, qs("raw").value);
  });
  window.addEventListener("hashchange", setBanner);
  window.addEventListener("beforeunload", (event) => {
    if (!shared.dirty)
      return;
    event.preventDefault();
    event.returnValue = "";
  });
};

// src/gui/frontend/rule-prompt.ts
var rulePromptText = (prompt) => {
  const names = prompt.rulesData?.rulebooks.map((rulebook) => rulebook.name) ?? [];
  return [
    "Use the cc-safety-net skill for this request.",
    "If that skill is not available, run \`npx -y cc-safety-net rule doc\` first and treat its output as the source of truth for schema, paths, and validation.",
    "",
    prompt.rulesScope === "project" ? \`Scope: this project - \${prompt.projectPath.trim()}\` : "Scope: all projects (user scope)",
    \`Existing rulebooks (names must stay unique across both scopes): \${names.length > 0 ? names.join(", ") : "none"}\`,
    "",
    prompt.request.trim()
  ].join(\`
\`);
};

// src/gui/frontend/views/rules.ts
var rulesData = null;
var requested = false;
var scope = "project";
var pendingFocus = null;
var directoryPickerFailed = false;
var exampleRequests = {
  suggest: t.exampleSuggestRequest,
  block: t.exampleBlockRequest,
  verify: t.exampleVerifyRequest
};
var showPathEnd = () => {
  const input = qs("rules-project-path");
  input.title = input.value;
  if (document.activeElement !== input)
    input.scrollLeft = input.scrollWidth;
};
var render3 = () => {
  const loaded = rulesData;
  if (!loaded)
    return;
  const pathInput = qs("rules-project-path");
  if (!pathInput.value)
    pathInput.value = loaded.projectPath;
  const canPick = loaded.canPickDirectory && !directoryPickerFailed;
  pathInput.readOnly = canPick;
  qs("rules-choose-directory").hidden = !canPick;
  showPathEnd();
  qs("rules-list").innerHTML = loaded.rulebooks.length === 0 ? loaded.errors.length > 0 ? \`<p class="empty">\${escapeHtml(t.allRulebooksSkipped)}</p>\` : \`<p class="empty">\${t.noCustomRules}</p>\` : loaded.rulebooks.map((rulebook) => \`<section class="rulebook">
    <div class="rulebook-head">
      <strong>\${escapeHtml(rulebook.name)}</strong>
      <span class="count">v\${escapeHtml(rulebook.version)}</span>
      <span>\${rulebook.source === "user" ? t.allProjects : t.thisProject}</span>
      <span>\${t.ruleCount(rulebook.rules.length)}</span>
      \${rulebook.spec === rulebook.name ? "" : \`<code>\${escapeHtml(rulebook.spec)}</code>\`}
    </div>
    <ul class="card rows">\${rulebook.rules.map((rule) => \`<li class="setting-row rulebook-rule\${pendingFocus === rule.name ? " focused" : ""}">
      <div class="rulebook-rule-head"><code class="command">\${escapeHtml([rule.command, rule.subcommand].filter(Boolean).join(" "))}</code><code class="rule-id">custom.\${escapeHtml(rule.name)}</code></div>
      <p>\${escapeHtml(rule.reason)}</p>
      <p class="muted">\${t.blocksWhenArgument} \${rule.block_args.map((arg) => \`<code>\${escapeHtml(arg)}</code>\`).join(" ")}</p>
    </li>\`).join("")}</ul>
  </section>\`).join("");
  const diagnostics = [
    ...loaded.errors.map((text) => \`<p class="notice error">\${escapeHtml(text)}</p>\`),
    ...loaded.warnings.map((text) => \`<p class="notice warn">\${escapeHtml(text)}</p>\`)
  ];
  qs("rules-diagnostics").innerHTML = diagnostics.join("");
  qs("rules-diagnostics-panel").hidden = diagnostics.length === 0;
  if (!pendingFocus)
    return;
  const focused = qs("rules-list").querySelector(".focused");
  if (focused)
    focused.scrollIntoView({ block: "center" });
  if (!focused)
    notify(t.customRuleMissing(\`custom.\${pendingFocus}\`), "error");
  pendingFocus = null;
};
var loadRules = async () => {
  requested = true;
  const result = await requestJson("/api/rules");
  if (!result.ok || !Array.isArray(result.data?.rulebooks)) {
    qs("rules-list").innerHTML = \`<p class="empty">\${escapeHtml(t.couldNotLoadRules(errorText(result)))}</p>\`;
    rulesData = null;
    requested = false;
    qs("rules-diagnostics-panel").hidden = true;
    return;
  }
  rulesData = result.data;
  render3();
};
var showRules = (params) => {
  const focus = params.get("focus");
  const compose = params.get("compose");
  if (focus)
    pendingFocus = focus.replace(/^custom\\./, "");
  if (compose) {
    qs("rules-composer-input").value = compose;
    qs("rules-composer-panel").scrollIntoView({ block: "start" });
    qs("rules-composer-input").focus();
  }
  showPathEnd();
  if (!requested) {
    loadRules();
    return;
  }
  if (focus)
    render3();
};
var setScope = (next) => {
  scope = next;
  document.querySelectorAll("[data-rules-scope]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.rulesScope === next));
  });
  qs("rules-project-path-field").hidden = next !== "project";
  showPathEnd();
};
var chooseProjectDirectory = async (button) => {
  if (button.disabled)
    return;
  button.disabled = true;
  const result = await requestJson("/api/rules/choose-directory", { method: "POST" });
  button.disabled = false;
  if (result.ok && result.data.path) {
    qs("rules-project-path").value = result.data.path;
    showPathEnd();
    return;
  }
  if (result.ok && result.data.cancelled)
    return;
  directoryPickerFailed = true;
  qs("rules-project-path").readOnly = false;
  button.hidden = true;
  notify(t.folderPickerUnavailable, "error", t.typeFolderInstead(result.ok ? result.data.error : errorText(result)));
};
var copyRulePrompt = async (button) => {
  const request = qs("rules-composer-input").value;
  const projectPath = qs("rules-project-path").value;
  if (!rulesData) {
    notify(t.rulesNotLoaded, "error", t.refreshAndRetry);
    return;
  }
  if (!request.trim()) {
    notify(t.describeRuleFirst, "error");
    return;
  }
  if (scope === "project" && !projectPath.trim()) {
    notify(t.enterProjectFolder, "error");
    return;
  }
  button.disabled = true;
  const copied = await navigator.clipboard.writeText(rulePromptText({ rulesData, rulesScope: scope, projectPath, request })).then(() => true, () => false);
  button.disabled = false;
  if (!copied) {
    notify(t.copyFailed, "error");
    return;
  }
  qs("rules-composer-input").value = "";
  notify(t.promptCopied, "ok", t.pasteIntoAgent);
};
var initRules = () => {
  qs("rules-refresh").addEventListener("click", (event) => {
    runRefresh(event.currentTarget, loadRules);
  });
  qs("rules-project-path").addEventListener("blur", showPathEnd);
  qs("rules-choose-directory").addEventListener("click", (event) => {
    chooseProjectDirectory(event.currentTarget);
  });
  qs("rules-copy-prompt").addEventListener("click", (event) => {
    copyRulePrompt(event.currentTarget);
  });
  qs("rules-composer-panel").addEventListener("click", (event) => {
    const target = event.target;
    const scopeButton = target.closest("[data-rules-scope]");
    if (scopeButton) {
      setScope(scopeButton.dataset.rulesScope ?? "project");
      return;
    }
    const example = target.closest("[data-rules-example]");
    if (example)
      qs("rules-composer-input").value = exampleRequests[example.dataset.rulesExample ?? ""] ?? "";
  });
};

// src/gui/frontend/views/settings.ts
var themes = ["auto", "light", "dark"];
var applyTheme = (theme) => {
  document.documentElement.style.colorScheme = theme === "auto" ? "light dark" : theme;
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
  });
};
var savedTheme = guiData.preferences.theme ?? "auto";
var chooseTheme = async (theme) => {
  applyTheme(theme);
  if (await savePreference({ theme })) {
    savedTheme = theme;
    return;
  }
  applyTheme(savedTheme);
};
var renderRetention = () => {
  const days = shared.policy?.policy.audit.retention_days;
  if (days === undefined)
    return;
  qs("retention-days").value = String(days);
  qs("retention-unit").textContent = t.dayUnit(days);
};
var blockedBy = () => (shared.policy?.errors.length ?? 0) > 0 ? t.repairInProtectionsFirst : shared.drafting ? t.leaveProjectDraftFirst : shared.dirty ? t.saveProtectionsFirst : null;
var saveRetentionDays = async (days) => {
  const saved = shared.policy;
  if (!saved)
    return;
  const current = saved.policy.audit.retention_days;
  const problem = !Number.isInteger(days) || days < MIN_AUDIT_RETENTION_DAYS || days > MAX_AUDIT_RETENTION_DAYS ? t.retentionRange(MIN_AUDIT_RETENTION_DAYS, MAX_AUDIT_RETENTION_DAYS) : blockedBy();
  if (problem) {
    renderRetention();
    notify(t.retentionUnchanged, "error", problem);
    return;
  }
  if (days === current)
    return;
  if (days < current && !await confirmDialog({
    title: t.shortenRetentionTitle(days),
    body: t.shortenRetentionBody(days),
    detail: qs("logs-path").textContent ?? "",
    confirmLabel: t.shortenRetention
  })) {
    renderRetention();
    return;
  }
  await runExclusive(t.savingStatus, async () => {
    const policy = clonePolicy(saved.policy);
    policy.audit.retention_days = days;
    const result = await requestJson("/api/policy", {
      method: "POST",
      body: JSON.stringify(policy)
    });
    if (!isWriteSuccess(result)) {
      renderRetention();
      notify(t.saveFailed, "error", errorText(result));
      return;
    }
    if (!await loadPolicy())
      return;
    limitActivityDays(days);
    await Promise.all([loadOverview(), loadActivity()]);
    notify(t.retentionSaved(days), "ok");
  });
};
var resetPolicy = async () => {
  const saved = shared.policy;
  if (!saved)
    return;
  if (shared.drafting) {
    notify(t.resetUnavailable, "error", t.leaveProjectDraftFirst);
    return;
  }
  if (!await confirmDialog({
    title: t.resetPolicyTitle,
    body: t.resetPolicyBody,
    detail: saved.path,
    confirmLabel: t.resetPolicy
  }))
    return;
  await runExclusive(t.resettingStatus, async () => {
    const result = await requestJson("/api/reset", { method: "POST", body: "{}" });
    if (!isWriteSuccess(result)) {
      notify(t.resetFailed, "error", errorText(result));
      return;
    }
    sessionStorage.removeItem("cc-safety-net-draft");
    if (await loadPolicy())
      notify(t.policyReset, "ok", result.data.path);
  });
};
var initSettings = () => {
  document.querySelectorAll("[data-copy-path]").forEach((button) => {
    button.innerHTML = \`\${icons.copy}<span>\${escapeHtml(t.copy)}</span>\`;
    button.addEventListener("click", () => {
      copyText(button, qs(button.dataset.copyPath ?? "").dataset.path ?? "");
    });
  });
  applyTheme(savedTheme);
  qs("settings-theme").addEventListener("click", (event) => {
    const theme = event.target.closest("[data-theme-choice]")?.dataset.themeChoice;
    if (themes.includes(theme))
      chooseTheme(theme);
  });
  qs("retention-days").addEventListener("change", (event) => {
    saveRetentionDays(Number(event.target.value));
  });
  qs("reset").addEventListener("click", () => {
    resetPolicy();
  });
  on("policy", renderRetention);
};

// src/gui/frontend/main.ts
var translatedAttributes = ["title", "aria-label", "placeholder"];
var translatePage = () => {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t[element.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = t[element.dataset.i18nHtml];
  });
  translatedAttributes.forEach((attribute) => {
    document.querySelectorAll(\`[data-i18n-\${attribute}]\`).forEach((element) => {
      element.setAttribute(attribute, t[element.getAttribute(\`data-i18n-\${attribute}\`)]);
    });
  });
};
var views = {
  overview: [t.navOverview, () => {
    return;
  }],
  activity: [t.navActivity, showActivity],
  policy: [t.navProtections, showPolicy],
  rules: [t.navCustomRules, showRules],
  integrations: [t.navAgents, () => {
    return;
  }],
  settings: [t.navSettings, () => {
    return;
  }]
};
var applyView = () => {
  const [hashName = "", query = ""] = location.hash.slice(1).split("?");
  const view = hashName in views ? hashName : "overview";
  document.body.dataset.view = view;
  document.title = \`\${views[view][0]} · CC Safety Net\`;
  document.querySelectorAll("[data-view]").forEach((section) => {
    section.hidden = section.dataset.view !== view;
  });
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.removeAttribute("aria-current");
    if (link.dataset.nav === view)
      link.setAttribute("aria-current", "page");
  });
  window.scrollTo({ top: 0 });
  views[view][1](new URLSearchParams(query));
};
translatePage();
initConfirmDialog();
initOverview();
initActivity();
initPolicy();
initRules();
initIntegrations();
initSettings();
qs("toast-close").addEventListener("click", () => notify(""));
document.querySelectorAll("[data-language-select]").forEach((select) => {
  select.value = locale;
  select.addEventListener("change", () => {
    const language = select.value;
    if (!locales.includes(language) || language === locale)
      return;
    savePreference({ language }).then((saved) => {
      if (saved)
        location.reload();
      select.value = locale;
    });
  });
});
on("dirty", () => {
  qs("nav-dirty").hidden = !shared.dirty;
});
window.addEventListener("hashchange", applyView);
applyView();
Promise.all([loadIntegrations(), loadHealth()]);
loadPolicy().then((loaded) => {
  if (location.hash.startsWith("#policy?"))
    applyView();
  if (loaded)
    loadStarContext();
  limitActivityDays(retentionDays());
  loadOverview();
  loadActivity();
});

  </script>
</body>
</html>
`;var tf='<script id="ccsn-data" type="application/json">';function rf(P,L=nf){return L.replace(tf,()=>tf+JSON.stringify(P).replaceAll("<","\\u003c"))}var Vs="kenryu42/cc-safety-net",xk=`https://github.com/${Vs}`,ff=1e4,Pk=7,Sk="The project draft directory changed; reload the draft before applying.",Rk="audit settings are user scope only; remove the audit section from a project proposal";async function mf(P,L={}){let H=mn({label:"gui",booleans:{noOpen:["--no-open"]}},P),Y=L.log??console.log,Z=L.error??console.error;if(H.errors.length>0){for(let se of H.errors)Z(se);return Z("Usage: cc-safety-net gui [--no-open]"),1}let oe=await Ek(c,L);if(Y(`CC Safety Net policy GUI: ${oe.url}`),!H.flags.noOpen)try{await(L.openBrowser??Hk)(oe.url)}catch(se){Z(`Failed to open browser: ${se instanceof Error?se.message:String(se)}`),Z(`Open this URL manually: ${oe.url}`)}if(L.keepAlive===!1)return await oe.close(),0;return await Fk(oe),0}async function Ek(P,L={}){let H=hk(24).toString("base64url"),Y={dir:null,revision:0},Z=wk((me,he)=>{Tk(P,me,he,H,L,Y)});await new Promise((me,he)=>{Z.once("error",he),Z.listen(0,"127.0.0.1",()=>{Z.off("error",he),me()})});let se=`http://127.0.0.1:${Z.address().port}`;return{origin:se,token:H,url:`${se}/?token=${encodeURIComponent(H)}`,close:()=>jk(Z)}}async function Tk(P,L,H,Y,Z,oe){let se=P(),me=new URL(L.url??"/","http://127.0.0.1");if(L.method==="GET"&&me.pathname==="/favicon.ico"){H.writeHead(204,{"cache-control":"no-store"}),H.end();return}if(!Dk(L,me,Y)){rn(H,403,{error:"Forbidden"});return}if(L.method==="GET"&&me.pathname==="/"){let he=sf(of(se,Z));await Promise.resolve(Z.buildDocument?.()).then((ke)=>Lk(H,rf({token:Y,preferences:he},ke)),(ke)=>rn(H,500,{error:ke instanceof Error?ke.message:String(ke)}));return}if(L.method==="POST"&&me.pathname==="/api/preferences"){let he=await Qt(L);if(!he.ok){rn(H,he.status,{errors:[he.error]});return}let ke=Qp(he.value);if(!ke){rn(H,400,{errors:["preferences accept only language (en, ja, zh-CN) and theme (auto, light, dark)"]});return}let Pe=of(se,Z),Te=ef(sf(Pe),ke),_e=Ak(Pe,Te);rn(H,_e?500:200,_e?{errors:[_e]}:{preferences:Te});return}if(L.method==="GET"&&me.pathname==="/api/policy"){let he=Du(se,Z),ke=R(se,qs(Z));rn(H,200,{...he,configState:Ve(ke),...ke.policyScopes?{projectPolicy:{path:y(Z.cwd??process.cwd()),weakenings:ke.policyScopes.weakeningsIgnored?[]:ke.policyScopes.weakenings}}:{},destructiveCommandRules:q,secretPatterns:dt,version:pn(),preview:he.errors.length>0?null:Be(he.policy,se.env)});return}if(L.method==="POST"&&me.pathname==="/api/policy/preview"){let he=await Qt(L);if(!he.ok){rn(H,he.status,{errors:[he.error]});return}let ke=Nu(se,he.value);rn(H,ke.errors.length>0?400:200,ke);return}if(L.method==="POST"&&me.pathname==="/api/policy/explain"){let he=await Qt(L);if(!he.ok){rn(H,he.status,{errors:[he.error]});return}let ke=he.value;if(ke===null||typeof ke.command!=="string"){rn(H,400,{errors:["command must be a string"]});return}let Pe=Cr(ke.policy,se.home);if(Pe.length>0){rn(H,400,{errors:Pe});return}rn(H,200,Ok(se,ke.command,ke.policy,Z));return}if(L.method==="POST"&&me.pathname==="/api/policy"){let he=await Qt(L);if(!he.ok){rn(H,he.status,{errors:[he.error]});return}let ke=Hn(se,he.value,Z);rn(H,ke.errors.length>0?400:200,ke);return}if(L.method==="POST"&&me.pathname==="/api/reset"){rn(H,200,Hn(se,ne,Z));return}if(L.method==="POST"&&me.pathname==="/api/repair"){rn(H,200,Lu(se,Z));return}if(L.method==="POST"&&me.pathname==="/api/policy/project/choose-directory"){let he=await(Z.chooseDirectory??Gs)();if("path"in he)oe.dir=he.path,oe.revision+=1;rn(H,200,{cancelled:"cancelled"in he,..."error"in he?{error:he.error}:{}});return}if(L.method==="GET"&&me.pathname==="/api/policy/project"){let he=gf(oe,Z),ke=yf(se,he,Z),Pe=ke?{projection:{},diagnostics:[ke]}:af(he,se.home),Te=xr(se,Z);rn(H,200,{path:y(he),revision:oe.revision,baseline:Te.baseline,userPolicyDiagnostics:Te.diagnostics,projection:Pe.projection,projectionDiagnostics:Pe.diagnostics,canPickDirectory:Bs(process.platform,process.env)});return}if(L.method==="POST"&&me.pathname==="/api/policy/project/diff"){let he=await lf(se,L,H,oe,Z);if(!he)return;let ke=af(he.dir,se.home),Pe=xr(se,Z).baseline,Te=te(Pe,fe(he.proposal,se.home).policy);rn(H,200,{rows:Ro(te(Pe,ke.projection).policy,Te.policy,!1),weakenings:Te.weakenings,existingFileDiagnostics:ke.diagnostics});return}if(L.method==="POST"&&me.pathname==="/api/policy/project/apply"){let he=await lf(se,L,H,oe,Z);if(!he)return;let ke=Ik(he.dir,he.proposal,se.home);rn(H,ke.errors.length>0?500:200,ke);return}if(L.method==="GET"&&me.pathname==="/api/activity"){let he=ie(se,Z),ke=$k(me.searchParams.get("days"),he);if(ke===null){rn(H,400,{error:`days must be an integer between 1 and ${he}`});return}rn(H,200,Vp(se,ke,Z.activityLogsDir));return}if(L.method==="POST"&&me.pathname==="/api/rules/choose-directory"){rn(H,200,await Gs());return}if(L.method==="GET"&&me.pathname==="/api/rules"){let he=ee(se,qs(Z)),ke=new Map(he.rules.map((Pe)=>[Pe.name,Pe]));rn(H,200,{projectPath:Z.cwd??process.cwd(),canPickDirectory:Bs(process.platform,process.env),rulebooks:he.rulebooks.map((Pe)=>({source:Pe.source,spec:Pe.spec,name:Pe.name,version:Pe.version,rules:Pe.rules.flatMap((Te)=>{let _e=ke.get(Te);if(!_e)return[];return[{name:_e.name,command:_e.command,subcommand:_e.subcommand,block_args:_e.block_args,reason:_e.reason}]})})),errors:he.errors,warnings:he.warnings});return}if(L.method==="GET"&&me.pathname==="/api/star/context"){rn(H,200,await(Z.fetchStarContext??(()=>Vk(se,{logsDir:Z.activityLogsDir})))());return}if(L.method==="POST"&&me.pathname==="/api/star"){let he=await(Z.starRepo??Mk)();rn(H,200,he.ok?{ok:!0}:{ok:!1,fallbackUrl:xk});return}if(L.method==="GET"&&me.pathname==="/api/integrations"){rn(H,200,await(Z.fetchIntegrations??(()=>Uk(se)))());return}if(L.method==="GET"&&me.pathname==="/api/health"){rn(H,200,await(Z.fetchHealth??Gk)());return}if(L.method==="POST"&&(me.pathname==="/api/install"||me.pathname==="/api/uninstall")){let he=await Qt(L);if(!he.ok){rn(H,he.status,{errors:[he.error]});return}let ke=he.value?.target;if(typeof ke!=="string"||!On.some((Te)=>Te.target===ke)){rn(H,400,{error:"unknown target"});return}let Pe=me.pathname==="/api/install"?"install":"uninstall";rn(H,200,await(Z.runIntegration??qk)(Pe,ke));return}rn(H,404,{error:"Not found"})}function of(P,L){return kk(pf(le(P,L)),"gui.json")}function sf(P){if(!uf(P))return{};try{return Xp(JSON.parse(bk(P,"utf-8")))}catch{return{}}}function Ak(P,L){try{return vk(pf(P),{recursive:!0}),an(P,`${JSON.stringify(L,null,2)}
`),null}catch(H){return H instanceof Error?H.message:String(H)}}function qs(P){return{...P,cwd:P.cwd??process.cwd()}}function gf(P,L){return P.dir??L.cwd??process.cwd()}function yf(P,L,H){if(!O(P,{...H,cwd:L}))return null;return`${y(L)} is the user policy, not a project policy; choose a project directory, or run the GUI from one`}function af(P,L){let H=y(P),Y=uf(H)?$t(H):{value:void 0,errors:[]},Z=fe(Y.value,L);return{projection:Z.policy,diagnostics:[...Y.errors,...Z.diagnostics]}}async function lf(P,L,H,Y,Z){let oe=gf(Y,Z),se=Y.revision,me=await Qt(L);if(!me.ok)return rn(H,me.status,{errors:[me.error]}),null;let he=me.value;if(typeof he?.revision!=="number")return rn(H,400,{errors:["revision must be a number"]}),null;if(he.revision!==se)return rn(H,409,{errors:[Sk]}),null;let ke=yf(P,oe,Z);if(ke)return rn(H,400,{errors:[ke]}),null;let Pe=_k(he.proposal,P.home);if(Pe.length>0)return rn(H,400,{errors:Pe}),null;return{dir:oe,proposal:he.proposal}}function _k(P,L){let H=Cr(P,L);if(H.length>0)return H;return P?.audit===void 0?[]:[Rk]}function Ik(P,L,H){let Y=y(P),Z=Eo(L,k(L,H));try{return h(i(w(P,"project policy"),Y),`${JSON.stringify(Z,null,2)}
`),{path:Y,errors:[]}}catch(oe){return{path:Y,errors:[oe instanceof Error?oe.message:String(oe)]}}}function Ok(P,L,H,Y){let Z=k(H,P.home),oe=R(P,qs(Y)),se=Ne({rules:oe.policy.rules,transparentWrappers:oe.policy.transparentWrappers,commandTools:oe.policy.commandTools,safety:ze(Z.safety),worktreeMode:Z.workflow.worktree_mode,destructiveCommandProtectionEnabled:Z.destructive_command_protection.enabled,destructiveCommandRuleOverrides:Z.destructive_command_protection.overrides,destructiveCommandAllowPaths:Z.destructive_command_protection.allow_paths,secretProtection:{enabled:Z.secret_protection.enabled,disabledRules:mt(Z.secret_protection.overrides),denyPaths:Z.secret_protection.deny_paths,allowPaths:Z.secret_protection.allow_paths}});return gr(L,{policySnapshot:se,cwd:Y.cwd,userConfigDir:Y.userConfigDir},P)}function $k(P,L){if(P===null)return Math.min(Pk,L);let H=Number(P);if(!Number.isInteger(H)||H<1||H>L)return null;return H}function Dk(P,L,H){if(L.searchParams.get("token")!==H)return!1;if(P.method!=="POST")return!0;return P.headers["x-cc-safety-net-token"]===H}var Nk=1048576;async function Qt(P){let L=[],H=0;for await(let Y of P){let Z=Y;if(H+=Z.byteLength,H>Nk)return{ok:!1,status:413,error:"Request body is too large"};L.push(Z)}try{return{ok:!0,value:JSON.parse(Buffer.concat(L).toString("utf-8")||"{}")}}catch(Y){return{ok:!1,status:400,error:`Invalid JSON: ${Y instanceof Error?Y.message:String(Y)}`}}}function Lk(P,L){P.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}),P.end(L)}function rn(P,L,H){P.writeHead(L,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}),P.end(JSON.stringify(H))}function jk(P){return new Promise((L,H)=>{P.close((Y)=>Y?H(Y):L())})}function Fk(P){return new Promise((L)=>{let H=()=>{process.off("SIGINT",Y),process.off("SIGTERM",Y)},Y=()=>{H(),P.close().then(L)};process.once("SIGINT",Y),process.once("SIGTERM",Y)})}function Hk(P){let L=process.platform==="darwin"?"open":process.platform==="win32"?"cmd":"xdg-open",H=process.platform==="win32"?["/c","start","",P]:[P];return new Promise((Y,Z)=>{let oe=df(L,H,{detached:!0,stdio:"ignore"}),se=(he)=>{oe.off("spawn",me),Z(he)},me=()=>{oe.off("error",se),oe.unref(),Y()};oe.once("error",se),oe.once("spawn",me)})}async function Mk(P="gh",L=ff){return{ok:await Kk(P,["api","-X","PUT",`/user/starred/${Vs}`],L)===0}}async function Uk(P,L={}){let H=await Nr((Z)=>Jt({environment:P,cwd:process.cwd(),openCodeVersion:Z}).status!=="n/a",L.fetcher),Y=Bk(P,H);return{targets:Rn.map((Z)=>{let oe=Y.find((se)=>se.platform===Z.id);return{target:Z.id,label:cn(Z.id),version:H.versions[Z.id]??null,status:oe?.configured?"active":oe?.detected?"disabled":oe?.inspectionStatus==="not-inspected"?"not-inspected":"not-installed"}}),system:{version:H.version,nodeVersion:H.nodeVersion,platform:H.platform}}}function Bk(P,L){return zt(P,process.cwd(),{ampPluginListOutput:L.ampPluginListOutput,codexPluginListOutput:L.codexPluginListOutput,copilotCliVersion:L.versions["copilot-cli"],openCodeVersion:L.versions.opencode,openCodePluginListOutput:L.openCodePluginListOutput})}async function Gk(P={}){let L=await(P.checkUpdates??Bn)();return{update:{latestVersion:L.latestVersion??null,updateAvailable:L.updateAvailable}}}var cf=Promise.resolve();function qk(P,L,H={}){let Y=async()=>{let oe=[],{log:se,error:me}=console;console.log=(...he)=>oe.push(he.map(String).join(" ")),console.error=console.log;try{return{ok:await kr(P,[],{selectTargets:async()=>[L],output:new Ck({write(ke,Pe,Te){oe.push(String(ke).replace(/\n$/,"")),Te()}}),...H})===0,output:oe.join(`
`)}}finally{console.log=se,console.error=me}},Z=cf.then(Y);return cf=Z.then(()=>{return},()=>{return}),Z}async function Vk(P,L={}){let[H,Y]=await Promise.all([Jk(L.fetchRepo),Promise.resolve(Ir(P,ie(P),L.logsDir).totalBlocked)]);return{starCount:H,blockedTotal:Y}}function Kk(P,L,H){return new Promise((Y)=>{let Z=df(P,L,{stdio:"ignore",windowsHide:!0}),oe=!1,se=setTimeout(()=>{Z.kill(),me(null)},H),me=(he)=>{if(oe)return;oe=!0,clearTimeout(se),Y(he)};Z.once("error",()=>me(null)),Z.once("close",me)})}async function Jk(P=fetch){try{let L=await P(`https://api.github.com/repos/${Vs}`,{headers:{accept:"application/vnd.github+json"},signal:AbortSignal.timeout(ff)});if(!L.ok)return null;let H=await L.json();return typeof H.stargazers_count==="number"?H.stargazers_count:null}catch{return null}}function zk(P){if(P[0]!=="help")return!1;let L=P[1];if(!L)gs(),process.exit(0);if(yr(L))process.exit(0);console.error(`Unknown command: ${L}`),console.error("Run 'cc-safety-net --help' for available commands."),process.exit(1)}var Wk={hook:async()=>{console.error("hook requires exactly one integration flag. Try: cc-safety-net hook --kimi-code"),yr("hook",console.error),process.exit(1)},install:async(P)=>{process.exit(await kr("install",P))},update:async(P)=>{process.exit(await _s(P))},uninstall:async(P)=>{process.exit(await kr("uninstall",P))},rule:async(P)=>{process.exit(await Bp(c(),P))},policy:async(P)=>{process.exit(await Mu(c(),P))},status:async(P)=>{if($n(mn({label:"status"},P).errors))process.exit(1);qp(c())},statusline:async(P)=>{let L=mn({label:"statusline",booleans:{claudeCode:["-cc","--claude-code"]}},P);if(L.errors.length===0&&L.flags.claudeCode){await Us(c());return}if($n(L.errors),!L.flags.claudeCode)console.error("statusline requires --claude-code (-cc)");yr("statusline",console.error),process.exit(1)},doctor:async(P)=>{let L=ss(P);if(!L)process.exit(1);let H=await ed(c(),{json:L.json,skipUpdateCheck:L.skipUpdateCheck});process.exit(H)},logs:async(P)=>{process.exit(await Qs(c(),P))},gui:async(P)=>{process.exit(await mf(P))},explain:async(P)=>{process.exit(await ud(c(),P))}};async function Yk(P){let L=mn({label:"cc-safety-net",booleans:{version:["-V","--version"]},positionals:"list"},P);if(zk(P))return;let H=P[0],Y=H?_r(H):void 0;if(L.help&&Y&&Y.name!=="rule")yr(Y.name),process.exit(0);if(!H||L.help&&!Y)gs(),process.exit(0);if(L.flags.version)md(),process.exit(0);if(Y){await Wk[Y.name](P.slice(1));return}if(H==="--statusline"){await Us(c());return}console.error(H.startsWith("-")?`Unknown option: ${H}`:`Unknown command: ${H}`),console.error("Run 'cc-safety-net --help' for usage."),process.exit(1)}export{Yk as runCli};
