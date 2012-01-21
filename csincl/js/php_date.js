/* 
 * More info at: http://phpjs.org
 * 
 * This is version: 2.94
 * php.js is copyright 2009 Kevin van Zonneveld.
 * 
 * Portions copyright Brett Zamir (http://brett-zamir.me), Kevin van Zonneveld
 * (http://kevin.vanzonneveld.net), Onno Marsman, Michael White
 * (http://getsprink.com), Waldo Malqui Silva, Paulo Ricardo F. Santos, Jack,
 * Jonas Raoni Soares Silva (http://www.jsfromhell.com), Philip Peterson, Ates
 * Goral (http://magnetiq.com), Legaev Andrey, Ratheous, Alex, Martijn
 * Wieringa, Nate, lmeyrick (https://sourceforge.net/projects/bcmath-js/),
 * Philippe Baumann, Enrique Gonzalez, Webtoolkit.info
 * (http://www.webtoolkit.info/), Theriault, Ash Searle
 * (http://hexmen.com/blog/), Jani Hartikainen, travc, Ole Vrijenhoek, Carlos
 * R. L. Rodrigues (http://www.jsfromhell.com), stag019, pilus,
 * http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript,
 * Michael Grier, marrtins, d3x, Andrea Giammarchi
 * (http://webreflection.blogspot.com), GeekFG (http://geekfg.blogspot.com),
 * Erkekjetter, Johnny Mast (http://www.phpvrouwen.nl), T.Wild, majak, David,
 * Oleg Eremeev, mdsjack (http://www.mdsjack.bo.it), Breaking Par Consulting
 * Inc
 * (http://www.breakingpar.com/bkp/home.nsf/0/87256B280015193F87256CFB006C45F7),
 * Mirek Slugen, Martin (http://www.erlenwiese.de/), Public Domain
 * (http://www.json.org/json2.js), Joris, Steven Levithan
 * (http://blog.stevenlevithan.com), Steve Hilder, KELAN, Arpad Ray
 * (mailto:arpad@php.net), T.J. Leahy, Marc Palau, Josh Fraser
 * (http://onlineaspect.com/2007/06/08/auto-detect-a-time-zone-with-javascript/),
 * gettimeofday, AJ, Aman Gupta, Felix Geisendoerfer
 * (http://www.debuggable.com/felix), Sakimori, Lars Fischer, Caio Ariede
 * (http://caioariede.com), Alfonso Jimenez (http://www.alfonsojimenez.com),
 * Pellentesque Malesuada, Tyler Akins (http://rumkin.com), gorthaur,
 * Thunder.m, Karol Kowalski, Kankrelune (http://www.webfaktory.info/), Frank
 * Forte, Subhasis Deb, duncan, Gilbert, class_exists, noname, Marco, madipta,
 * 0m3r, David James, Arno, Nathan, Mateusz "loonquawl" Zalega, ReverseSyntax,
 * Scott Cariss, Slawomir Kaniecki, Denny Wardhana, nobbler, sankai, Sanjoy
 * Roy, Douglas Crockford (http://javascript.crockford.com), mktime, marc
 * andreu, ger, john (http://www.jd-tech.net), Ole Vrijenhoek
 * (http://www.nervous.nl/), Steve Clay, Thiago Mata
 * (http://thiagomata.blog.com), Jon Hohle, Linuxworld, lmeyrick
 * (https://sourceforge.net/projects/bcmath-js/this.), Ozh, nord_ua, Pyerre,
 * Soren Hansen, Peter-Paul Koch (http://www.quirksmode.org/js/beat.html),
 * T0bsn, MeEtc (http://yass.meetcweb.com), Brad Touesnard, David Randall,
 * Bryan Elliott, Tim Wiel, XoraX (http://www.xorax.info), djmix, Paul, J A R,
 * Hyam Singer (http://www.impact-computing.com/), kenneth, T. Wild, Raphael
 * (Ao RUDLER), Marc Jansen, Francesco, Lincoln Ramsay, echo is bad, Der Simon
 * (http://innerdom.sourceforge.net/), Eugene Bulkin (http://doubleaw.com/),
 * LH, JB, Bayron Guevara, Cord, Francois, Kristof Coomans (SCK-CEN Belgian
 * Nucleair Research Centre), Pierre-Luc Paour, Martin Pool, Kirk Strobeck,
 * Saulo Vallory, Christoph, Artur Tchernychev, Wagner B. Soares, Valentina De
 * Rosa, Daniel Esteban, Jason Wong (http://carrot.org/), Rick Waldron,
 * Mick@el, Anton Ongson, Simon Willison (http://simonwillison.net), Gabriel
 * Paderni, Marco van Oort, Blues (http://tech.bluesmoon.info/), Luke Godfrey,
 * rezna, Tomasz Wesolowski, Eric Nagel, Pul, Bobby Drake, uestla, Alan C,
 * Yves Sucaet, sowberry, hitwork, Norman "zEh" Fuchs, Ulrich, johnrembo, Nick
 * Callen, ejsanders, Aidan Lister (http://aidanlister.com/), Brian Tafoya
 * (http://www.premasolutions.com/), Philippe Jausions
 * (http://pear.php.net/user/jausions), Orlando, dptr1988, HKM, metjay,
 * strcasecmp, strcmp, Taras Bogach, ChaosNo1, Alexander Ermolaev
 * (http://snippets.dzone.com/user/AlexanderErmolaev), Le Torbi, James, Chris,
 * DxGx, Pedro Tainha (http://www.pedrotainha.com), Philipp Lenssen,
 * penutbutterjelly, Greg Frazier, Tod Gentille, Alexander M Beedie,
 * FremyCompany, baris ozdil, FGFEmperor, Atli Þór, 3D-GRAF, jakes, gabriel
 * paderni, Yannoo, Luis Salazar (http://www.freaky-media.com/), Tim de
 * Koning, stensi, vlado houba, Jalal Berrami, date, Matteo, Victor, taith,
 * Robin, Matt Bradley, fearphage (http://http/my.opera.com/fearphage/),
 * Manish, davook, Benjamin Lupton, Russell Walker (http://www.nbill.co.uk/),
 * Garagoth, Andrej Pavlovic, Dino, Jamie Beck (http://www.terabit.ca/), DtTvB
 * (http://dt.in.th/2008-09-16.string-length-in-bytes.html), Christian
 * Doebler, setcookie, YUI Library:
 * http://developer.yahoo.com/yui/docs/YAHOO.util.DateLocale.html, Andreas,
 * Blues at http://hacks.bluesmoon.info/strftime/strftime.js, Greenseed,
 * mk.keck, Luke Smith (http://lucassmith.name), Rival, Diogo Resende, Allan
 * Jensen (http://www.winternet.no), Howard Yeend, Kheang Hok Chin
 * (http://www.distantia.ca/), Jay Klehr, Leslie Hoare, Ben Bryan, booeyOH,
 * Amir Habibi (http://www.residence-mixte.com/), Cagri Ekin
 * 
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL KEVIN VAN ZONNEVELD BE LIABLE FOR ANY CLAIM, DAMAGES
 * OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */ 


// Compression: minified


function date(format,timestamp){var that=this;var jsdate=((typeof(timestamp)=='undefined')?new Date():(typeof(timestamp)=='object')?new Date(timestamp):new Date(timestamp*1000));var pad=function(n,c){if((n=n+"").length<c){return new Array(++c-n.length).join("0")+n;}else{return n;}};var _dst=function(t){var dst=0;var jan1=new Date(t.getFullYear(),0,1,0,0,0,0);var june1=new Date(t.getFullYear(),6,1,0,0,0,0);var temp=jan1.toUTCString();var jan2=new Date(temp.slice(0,temp.lastIndexOf(' ')-1));temp=june1.toUTCString();var june2=new Date(temp.slice(0,temp.lastIndexOf(' ')-1));var std_time_offset=(jan1-jan2)/(1000*60*60);var daylight_time_offset=(june1-june2)/(1000*60*60);if(std_time_offset===daylight_time_offset){dst=0;}else{var hemisphere=std_time_offset-daylight_time_offset;if(hemisphere>=0){std_time_offset=daylight_time_offset;}
dst=1;}
return dst;};var ret='';var txt_weekdays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];var txt_ordin={1:"st",2:"nd",3:"rd",21:"st",22:"nd",23:"rd",31:"st"};var txt_months=["","January","February","March","April","May","June","July","August","September","October","November","December"];var f={d:function(){return pad(f.j(),2);},D:function(){var t=f.l();return t.substr(0,3);},j:function(){return jsdate.getDate();},l:function(){return txt_weekdays[f.w()];},N:function(){return f.w()?f.w():7;},S:function(){return txt_ordin[f.j()]?txt_ordin[f.j()]:'th';},w:function(){return jsdate.getDay();},z:function(){return(jsdate-new Date(jsdate.getFullYear()+"/1/1"))/864e5>>0;},W:function(){var a=f.z(),b=364+f.L()-a;var nd2,nd=(new Date(jsdate.getFullYear()+"/1/1").getDay()||7)-1;if(b<=2&&((jsdate.getDay()||7)-1)<=2-b){return 1;}
if(a<=2&&nd>=4&&a>=(6-nd)){nd2=new Date(jsdate.getFullYear()-1+"/12/31");return that.date("W",Math.round(nd2.getTime()/1000));}
var w=(1+(nd<=3?((a+nd)/7):(a-(7-nd))/7)>>0);return(w?w:53);},F:function(){return txt_months[f.n()];},m:function(){return pad(f.n(),2);},M:function(){var t=f.F();return t.substr(0,3);},n:function(){return jsdate.getMonth()+1;},t:function(){var n;if((n=jsdate.getMonth()+1)==2){return 28+f.L();}
if(n&1&&n<8||!(n&1)&&n>7){return 31;}
return 30;},L:function(){var y=f.Y();return(!(y&3)&&(y%1e2||!(y%4e2)))?1:0;},o:function(){if(f.n()===12&&f.W()===1){return jsdate.getFullYear()+1;}
if(f.n()===1&&f.W()>=52){return jsdate.getFullYear()-1;}
return jsdate.getFullYear();},Y:function(){return jsdate.getFullYear();},y:function(){return(jsdate.getFullYear()+"").slice(2);},a:function(){return jsdate.getHours()>11?"pm":"am";},A:function(){return f.a().toUpperCase();},B:function(){var off=(jsdate.getTimezoneOffset()+60)*60;var theSeconds=(jsdate.getHours()*3600)+
(jsdate.getMinutes()*60)+
jsdate.getSeconds()+off;var beat=Math.floor(theSeconds/86.4);if(beat>1000){beat-=1000;}
if(beat<0){beat+=1000;}
if((String(beat)).length==1){beat="00"+beat;}
if((String(beat)).length==2){beat="0"+beat;}
return beat;},g:function(){return jsdate.getHours()%12||12;},G:function(){return jsdate.getHours();},h:function(){return pad(f.g(),2);},H:function(){return pad(jsdate.getHours(),2);},i:function(){return pad(jsdate.getMinutes(),2);},s:function(){return pad(jsdate.getSeconds(),2);},u:function(){return pad(jsdate.getMilliseconds()*1000,6);},e:function(){return'UTC';},I:function(){return _dst(jsdate);},O:function(){var t=pad(Math.abs(jsdate.getTimezoneOffset()/60*100),4);t=(jsdate.getTimezoneOffset()>0)?"-"+t:"+"+t;return t;},P:function(){var O=f.O();return(O.substr(0,3)+":"+O.substr(3,2));},T:function(){return'UTC';},Z:function(){return-jsdate.getTimezoneOffset()*60;},c:function(){return f.Y()+"-"+f.m()+"-"+f.d()+"T"+f.h()+":"+f.i()+":"+f.s()+f.P();},r:function(){return f.D()+', '+f.d()+' '+f.M()+' '+f.Y()+' '+f.H()+':'+f.i()+':'+f.s()+' '+f.O();},U:function(){return Math.round(jsdate.getTime()/1000);}};return format.replace(/[\\]?([a-zA-Z])/g,function(t,s){if(t!=s){ret=s;}else if(f[s]){ret=f[s]();}else{ret=s;}
return ret;});}
function strtotime(str,now){var i,match,s,strTmp='',parse='';strTmp=str;strTmp=strTmp.replace(/\s{2,}|^\s|\s$/g,' ');strTmp=strTmp.replace(/[\t\r\n]/g,'');if(strTmp=='now'){return(new Date()).getTime()/1000;}else if(!isNaN(parse=Date.parse(strTmp))){return(parse/1000);}else if(now){now=new Date(now*1000);}else{now=new Date();}
strTmp=strTmp.toLowerCase();var __is={day:{'sun':0,'mon':1,'tue':2,'wed':3,'thu':4,'fri':5,'sat':6},mon:{'jan':0,'feb':1,'mar':2,'apr':3,'may':4,'jun':5,'jul':6,'aug':7,'sep':8,'oct':9,'nov':10,'dec':11}};var process=function(m){var ago=(m[2]&&m[2]=='ago');var num=(num=m[0]=='last'?-1:1)*(ago?-1:1);switch(m[0]){case'last':case'next':switch(m[1].substring(0,3)){case'yea':now.setFullYear(now.getFullYear()+num);break;case'mon':now.setMonth(now.getMonth()+num);break;case'wee':now.setDate(now.getDate()+(num*7));break;case'day':now.setDate(now.getDate()+num);break;case'hou':now.setHours(now.getHours()+num);break;case'min':now.setMinutes(now.getMinutes()+num);break;case'sec':now.setSeconds(now.getSeconds()+num);break;default:var day;if(typeof(day=__is.day[m[1].substring(0,3)])!='undefined'){var diff=day-now.getDay();if(diff==0){diff=7*num;}else if(diff>0){if(m[0]=='last'){diff-=7;}}else{if(m[0]=='next'){diff+=7;}}
now.setDate(now.getDate()+diff);}}
break;default:if(/\d+/.test(m[0])){num*=parseInt(m[0],10);switch(m[1].substring(0,3)){case'yea':now.setFullYear(now.getFullYear()+num);break;case'mon':now.setMonth(now.getMonth()+num);break;case'wee':now.setDate(now.getDate()+(num*7));break;case'day':now.setDate(now.getDate()+num);break;case'hou':now.setHours(now.getHours()+num);break;case'min':now.setMinutes(now.getMinutes()+num);break;case'sec':now.setSeconds(now.getSeconds()+num);break;}}else{return false;}
break;}
return true;};match=strTmp.match(/^(\d{2,4}-\d{2}-\d{2})(?:\s(\d{1,2}:\d{2}(:\d{2})?)?(?:\.(\d+))?)?$/);if(match!=null){if(!match[2]){match[2]='00:00:00';}else if(!match[3]){match[2]+=':00';}
s=match[1].split(/-/g);for(i in __is.mon){if(__is.mon[i]==s[1]-1){s[1]=i;}}
s[0]=parseInt(s[0],10);s[0]=(s[0]>=0&&s[0]<=69)?'20'+(s[0]<10?'0'+s[0]:s[0]+''):(s[0]>=70&&s[0]<=99)?'19'+s[0]:s[0]+'';return parseInt(this.strtotime(s[2]+' '+s[1]+' '+s[0]+' '+match[2])+(match[4]?match[4]/1000:''),10);}
var regex='([+-]?\\d+\\s'+'(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?'+'|sun\.?|sunday|mon\.?|monday|tue\.?|tuesday|wed\.?|wednesday'+'|thu\.?|thursday|fri\.?|friday|sat\.?|saturday)'+'|(last|next)\\s'+'(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?'+'|sun\.?|sunday|mon\.?|monday|tue\.?|tuesday|wed\.?|wednesday'+'|thu\.?|thursday|fri\.?|friday|sat\.?|saturday))'+'(\\sago)?';match=strTmp.match(new RegExp(regex,'g'));if(match==null){return false;}
for(i=0;i<match.length;i++){if(!process(match[i].split(' '))){return false;}}
return(now.getTime()/1000);}