module.exports = function(RED) {

    function RemoteServerNode(n) {
        RED.nodes.createNode(this,n);
        this.username = n.username;
        this.password = n.password;
        this.host = n.host;
        this.openSource = n.openSource;
        this.token="UNVALID TOKEN";
        if(!this.openSource){
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            

            const raw = JSON.stringify({
            "email": this.username,
            "password": this.password,
            "getToken": true
            });

            const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
            };
            (async()=>{
                try{
                    let res = await fetch(this.host+"/api/session", requestOptions);
                    if(!res.ok){console.log("fetch failed "+res.statusText)}
                    else{this.cookie=res['headers'].getSetCookie();
                    res = await res.json();
                    this.token=res['token'];
                }
                }
                catch(e){console.log(e)};
            })();
            
            
        }
        

    }
    RED.nodes.registerType("client-pisignage-credentials",RemoteServerNode);


    function LowerCaseNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.creds = RED.nodes.getNode(config.creds);
        this.method = config.method;
        this.content = config.content;
        
        
        
        
        node.on('input', function(msg) {
            let headers = new Headers();
            if(!this.creds.openSource){
                headers.set('Authorization', 'Bearer ' +  this.creds.token);
                headers.append("Cookie", this.creds.cookie[0].split(';')[0]);
            }
            else{
                headers.set('Authorization', 'Basic ' + btoa(this.creds.username + ":" + this.creds.password));
            }
            if(this.creds.openSource||this.creds.token!="UNVALID TOKEN"){
                payloadObject={};
                config.complexPayload.map(x=>{
                    var valueTemp="";
                    if(x['type'] === "msg"){
                        valueTemp= eval("msg." + x['value'])
                    }else if(x['type'] === "flow"){
                        valueTemp = this.context().flow.get(x['value']);
                    }else if(x['type'] === "global"){
                        valueTemp = this.context().global.get(x['value']);
                    }else{
                        valueTemp = x['value'];
                    }
                    payloadObject[x['name']]=valueTemp;
                });
               
                const content = config.content;
                const method=config.method;
                
                var baseUrl=this.creds.host+'/api/';
                let url=baseUrl;
                let res="";
                let requestOptions={};
                console.log("content : "+ content);
                console.log("method : "+ method);
                (async()=>{
                    try{
                        switch (content) {
                            case 'files':
                                
                                switch (method) {
                                    case 'GET ALL':
                                        url+='files';
                                        requestOptions={
                                            method :'GET',
                                            headers : headers,
                                        };
                                        
                                        res = await fetch(url,requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                        res = await res.json();
                                        msg.payload=res; 
                                        node.send(msg);
                                        }
                                        break;
                                    case 'POST FROM LOCAL':
                                        url+='files';
                                        const fs = require('fs'); 
                                        const mime = require('mime-types');
                                            
                                        const path=payloadObject["File's path"];         
                                        
                                        var formdata = new FormData();
                                        
                                        let mt=mime.lookup(path);
                                        const file=await fs.openAsBlob(path,{ type: mt });
                                        formdata.append("assets",file, path);
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            body: formdata
                                            };
                                        
                                        res = await fetch(url, requestOptions);

                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            const file2=res;
                                            headers.append("Content-Type", "application/json");
                                            const raw = JSON.stringify({
                                                "files": res['data'],
                                                "categories": []
                                            });
                                            requestOptions = {
                                                method: "POST",
                                                headers: headers,
                                                body: raw,
                                                redirect: "follow"
                                            };
                                            res = await fetch(baseUrl+"postupload", requestOptions);
                                            if(!res.ok){
                                                node.error("fetch 2 response not ok : "+res.statusText)}
                                            else{
                                            msg.payload=file2; 
                                            node.send(msg);
                                            }
                                        }                                           
                                        break;
                                    case 'DELETE':
                                        headers.set('Content-Type', 'application/json;');
                                        url+='files';
                                        url+='/';         
                                        url+=payloadObject["File's name"];
                                        requestOptions = {
                                            method: 'DELETE',
                                            headers: headers
                                            };
                                        
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }

                                        break;
                                    case 'GET ONE':
                                        url+='files';
                                        url+='/';         
                                        url+=payloadObject["File's name"];
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }
                                        break;
                                    case 'RENAME':
                                        url+='files/';
                                        headers.append("Content-Type", "application/json");
                                        url+=payloadObject["File's name"];
                                        const newName=payloadObject["New name"];
                                        
                                        const body=JSON.stringify({
                                                "newname": newName,
                                            });
                                        var requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            redirect: 'follow',
                                            body: body
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }
                                        break;
                                    case 'POST FROM STREAM':
                                        url+='files';
                                    
                                            
                                        const stream=Buffer.from(payloadObject["Data's stream"]);
                                        var formdata = new FormData();
                                        
                                        const blob=new Blob([stream],{
                                            type: payloadObject["Mime-type"],
                                        });
                                        formdata.append("assets",blob,payloadObject["File's name"]);
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            body: formdata,
                                            redirect: 'follow'
                                            };
                                            
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch 1 response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            const file=res;
                                            headers.append("Content-Type", "application/json");
                                            const raw = JSON.stringify({
                                                "files": res['data'],
                                                "categories": []
                                            });

                                            requestOptions = {
                                                method: "POST",
                                                headers: headers,
                                                body: raw,
                                                redirect: "follow"
                                            };
                                            res = await fetch(baseUrl+"postupload", requestOptions);
                                            if(!res.ok){
                                                node.error("fetch 2 response not ok : "+res.statusText)}
                                            else{
                                                res = await res.json();
                                                msg.payload=file; 
                                                node.send(msg);
                                            }
                                        }                                      
                                        break;
                                
                                    default:
                                        break;
                                }
                                break;
                            
                            case 'playlists':
                                
                                switch (method) {
                                    case 'GET ALL':
                                        url+='playlists';
                                        requestOptions={
                                            method :'GET',
                                            headers : headers,
                                        }
                                        res = await fetch(url,requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }   
                                        break;
                                    case 'CREATE':
                                        url+='playlists';  
                                        const plName=payloadObject["Playlist's name"];
                                        
                                        headers.append("Content-Type", "application/json");
                                        let raw=JSON.stringify({
                                                "file": plName
                                        });
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            redirect: 'follow',
                                            body: raw
                                            };
                                        res = await fetch(url, requestOptions)
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }   
                                        break;
                                    case 'DELETE':
                                        url+='playlistfiles';  
                                        let plName2=payloadObject["Playlist's name"];
                                        
                                        headers.append("Content-Type", "application/json");

                                        let url2=baseUrl+'files/__'+plName2+".json";
                                        res = await fetch(url2,{method: 'DELETE',
                                        headers: headers});
                                        if(!res.ok){
                                            node.error("fetch 1 response not ok : "+res.statusText)}
                                        else{
                                            let raw2=JSON.stringify({
                                                "playlist": plName2,
                                                "assets":[]
                                            });
                                            requestOptions = {
                                                method: 'POST',
                                                headers: headers,
                                                redirect: 'follow',
                                                body: raw2
                                                };
                                            res = await fetch(url, requestOptions)
                                            if(!res.ok){
                                                node.error("fetch 2 response not ok : "+res.statusText)}
                                            else{
                                                res = await res.json();
                                                msg.payload=res; 
                                                node.send(msg);
                                            }   
                                        }   
                                        break;

                                    case 'GET ONE':
                                        url+='playlists/';  
                                        url+=payloadObject["Playlist's name"];
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = await fetch(url, requestOptions)
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }   
                                        break;

                                    case 'ADD FILE':
                                        url+='playlists/';  
                                        const playlistName=payloadObject["Playlist's name"];
                                        
                                        url+=playlistName;
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = await fetch(url, requestOptions);
                                        //Get the PL informations
                                        if(!res.ok){
                                            node.error("fetch 1 response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            const nameFileToAdd=payloadObject["File's name"];
                                            console.log(nameFileToAdd+ " fetch 1 : ");
                                            console.log(res);
                                            let duration=parseInt(payloadObject["Duration"]);
                                            if(isNaN(duration)){duration=10;}
                                            const isVideo=payloadObject["Is video"]=="true";
                                            let assetsWithData= res['data']['assets'];
                                            let assetsNoData= assetsWithData.map(x=>x['filename']);
                                            assetsWithData.push({"filename":nameFileToAdd,"selected":true,"isVideo":isVideo,"option":{"main":false},"duration":duration});
                                            assetsNoData.push(nameFileToAdd);
                                            const bodyReq1=JSON.stringify({"assets":assetsWithData});
                                            headers.append("Content-Type", "application/json");
                                            var options = {
                                                method: 'POST',
                                                headers: headers,
                                                redirect: 'follow',
                                                body: bodyReq1
                                                };
                                            res = await fetch(url, options)
                                            if(!res.ok){
                                                node.error("fetch 2 response not ok : "+res.statusText)}
                                            else{
                                                res = await res.json();
                                                const file = res;
                                                console.log(nameFileToAdd+ " fetch 2 : ");
                                                console.log(res);
                                                let urlReq2=baseUrl+'playlistfiles';
                                                const bodyReq2=JSON.stringify({
                                                    "playlist":playlistName,
                                                    "assets":assetsNoData
                                                });
                                                var options2 = {
                                                    method: 'POST',
                                                    headers: headers,
                                                    redirect: 'follow',
                                                    body: bodyReq2
                                                    };
                                                res = await fetch(urlReq2, options2);
                                                if(!res.ok){
                                                    node.error("fetch 3 response not ok : "+res.statusText)}
                                                else{
                                                    url=baseUrl+"installationsettings";
                                                    const bodyReq2=JSON.stringify({"settings":{"uiDefaults":{"playlistView":"list"}}});
                                                    requestOptions = {
                                                        method: 'POST',
                                                        headers: headers,
                                                        redirect: 'follow',
                                                        body: bodyReq2
                                                        };
                                                    res = await fetch(url, requestOptions);
                                                    if(!res.ok){
                                                        node.error("fetch 4 response not ok : "+res.statusText)}
                                                    else{
                                                        res = await res.json();
                                                        msg.payload=file; 
                                                        node.send(msg);
                                                    }
                                                    
                                                }   
                                            }   
                                        }   
                                        break;
                                
                                    case 'REMOVE FILE':
                                        url+='playlists/';  
                                        const playlistName2=payloadObject["Playlist's name"];
                                        url+=playlistName2;
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = await fetch(url, requestOptions)
                                        if(!res.ok){
                                            node.error("fetch 1 response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            const nameFileToAdd=payloadObject["File's name"];
                                            let assetsWithData= res['data']['assets'];
                                            let assetsNoData= assetsWithData.map(x=>x['filename']);
                                            assetsWithData=assetsWithData.filter(x=>x['filename']!=nameFileToAdd);
                                            assetsNoData=assetsNoData.filter(x=>x!=nameFileToAdd);
                                            const bodyReq1=JSON.stringify({"assets":assetsWithData});
                                            headers.append("Content-Type", "application/json");
                                            var options = {
                                                method: 'POST',
                                                headers: headers,
                                                redirect: 'follow',
                                                body: bodyReq1
                                                };
                                            res = await fetch(url, options);
                                            if(!res.ok){
                                                node.error("fetch 2 response not ok : "+res.statusText)}
                                            else{
                                                const file = await res.json();
                                                let urlReq2=baseUrl+'playlistfiles'
                                                const bodyReq2=JSON.stringify({
                                                    "playlist":playlistName2,
                                                    "assets":assetsNoData
                                                });
                                                var options2 = {
                                                    method: 'POST',
                                                    headers: headers,
                                                    redirect: 'follow',
                                                    body: bodyReq2
                                                    };
                                                res = await fetch(urlReq2, options2);
                                                if(!res.ok){
                                                    node.error("fetch 3 response not ok : "+res.statusText)}
                                                else{
                                                    url=baseUrl+"installationsettings";
                                                    const bodyReq2=JSON.stringify({"settings":{"uiDefaults":{"playlistView":"list"}}});
                                                    requestOptions = {
                                                        method: 'POST',
                                                        headers: headers,
                                                        redirect: 'follow',
                                                        body: bodyReq2
                                                        };
                                                    res = await fetch(url, requestOptions);
                                                    if(!res.ok){
                                                        node.error("fetch 4 response not ok : "+res.statusText)}
                                                    else{
                                                        msg.payload=file; 
                                                        node.send(msg);
                                                    }
                                                }   
                                            }   
                                        }   
                                        break;
                                    default:
                                        break;
                                }
                                break;
                                
                            case 'groups':
                                
                                switch (method) {
                                    
                                    case 'GET ALL':
                                        url+='groups';
                                        requestOptions ={
                                            method :'GET',
                                            headers : headers,
                                        }
                                        res = await fetch(url,requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }   
                                        break;
                                    
                                    case 'CREATE':
                                        url+='groups';  
                                        let gName=payloadObject["Group's name"];
                                        
                                        headers.append("Content-Type", "application/json");
                                        let raw=JSON.stringify({  
                                                "name": gName
                                        });
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            redirect: 'follow',
                                            body: raw
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }   
                                        break;
                                    
                                    case 'GET ONE':
                                        url+='groups/';  
                                        url+=payloadObject["Group's id"];
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }   
                                        break;
                                    
                                    case 'DELETE':
                                        url+='groups/';  
                                        url+=payloadObject["Group's id"];
                                        requestOptions = {
                                            method: 'DELETE',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }   
                                        break;

                                    case 'ADD PLAYLIST & DEPLOY':
                                        url+='groups/';  
                                        url+=payloadObject["Group's id"];
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        //GET group informations
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch 1 response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            let assets = [];
                                            let playlists = res['data']['playlists'].filter(x=>x['name']!=payloadObject["Playlist's name"]);

                                            for(let i =0;i<playlists.length;i++){
                                                let url2=baseUrl+'playlists/'+playlists[i]['name'];
                                                requestOptions = {
                                                    method: 'GET',
                                                    headers: headers,
                                                    redirect: 'follow'
                                                };
                                                res = await fetch(url2, requestOptions);
                                                if(!res.ok){
                                                    node.error("fetch 2, index "+i+", response not ok : "+res.statusText)}
                                                else{
                                                    res = await res.json();
                                                    assets.push("__"+playlists[i]['name']+".json");
                                                    assets.push(res['data']['templateName']);
                                                    res['data']['assets'].map(x=>{assets.push(x['filename']); return x;});
                                                }
                                            }
                                            let url2=baseUrl+'playlists/'+payloadObject["Playlist's name"];
                                            requestOptions = {
                                                method: 'GET',
                                                headers: headers,
                                                redirect: 'follow'
                                            };
                                            res = await fetch(url2, requestOptions);
                                            if(!res.ok){
                                                node.error("fetch 2, playlist to add, response not ok : "+res.statusText)}
                                            else{
                                                res = await res.json();
                                                assets.push("__"+res['data']['name']+".json");
                                                assets.push(res['data']['templateName']);
                                                res['data']['assets'].map(x=>{assets.push(x['filename']); return x;});
                                                plToPush={
                                                    "name": res['data']['name'],
                                                    "settings": {
                                                        "durationEnable": false,
                                                        "timeEnable": false,
                                                        "ads": res['data']['settings']['ads'],
                                                        "audio": res['data']['settings']['audio']
                                                    },
                                                    "skipForSchedule": false,
                                                    "plType": "regular"
                                                };
                                                playlists.push(plToPush);
                                            }
                                            
                                            playlists= [...new Map(playlists.map(item =>
                                                [item['name'], item])).values()];


                                            assets=[...new Set(assets)];
                                            let raw=JSON.stringify({
                                                "playlists":playlists,
                                                "assets":assets,
                                                "deploy": true,
                                                "shuffleContent": payloadObject['Shuffle playlists']=='true',
                                                "combineDefaultPlaylist": payloadObject['Combine playlists']=='true'
                                            });
                                            headers.append("Content-Type", "application/json");
                                            requestOptions = {
                                                method: 'POST',
                                                headers: headers,
                                                redirect: 'follow',
                                                body: raw
                                                };
                                            res = await fetch(url, requestOptions);
                                            if(!res.ok){
                                                node.error("fetch 3 response not ok : "+res.statusText)}
                                            else{
                                                res = await res.json();
                                                msg.payload=res; 
                                                node.send(msg);
                                            }     
                                        }   
                                        break;
                                    
                                    case 'REMOVE PLAYLIST & DEPLOY':
                                        url+='groups/';  
                                        url+=payloadObject["Group's id"];
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        //GET group informations
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch 1 response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            let assets = [];
                                            let playlists = res['data']['playlists'].filter(x=>x['name']!=payloadObject["Playlist's name"]);

                                            for(let i =0;i<playlists.length;i++){
                                                let url2=baseUrl+'playlists/'+playlists[i]['name'];
                                                requestOptions = {
                                                    method: 'GET',
                                                    headers: headers,
                                                    redirect: 'follow'
                                                };
                                                res = await fetch(url2, requestOptions);
                                                if(!res.ok){
                                                    node.error("fetch 2, index "+i+", response not ok : "+res.statusText)}
                                                else{
                                                    res = await res.json();
                                                    assets.push("__"+playlists[i]['name']+".json");
                                                    assets.push(res['data']['templateName']);
                                                    res['data']['assets'].map(x=>{assets.push(x['filename']); return x;});
                                                }
                                            }
                                            assets=[...new Set(assets)];
                                            let raw=JSON.stringify({
                                                "playlists":playlists,
                                                "assets":assets,
                                                "deploy": true,
                                                "shuffleContent": payloadObject['Shuffle playlists']=='true',
                                                "combineDefaultPlaylist": payloadObject['Combine playlists']=='true'
                                            });
                                            headers.append("Content-Type", "application/json");
                                            requestOptions = {
                                                method: 'POST',
                                                headers: headers,
                                                redirect: 'follow',
                                                body: raw
                                                };
                                            res = await fetch(url, requestOptions);
                                            if(!res.ok){
                                                node.error("fetch 3 response not ok : "+res.statusText)}
                                            else{
                                                res = await res.json();
                                                msg.payload=res; 
                                                node.send(msg);
                                            }     
                                        }   
                                        break;
                                    
                                    case 'DEPLOY':
                                        url+='groups/';  
                                        url+=payloadObject["Group's id"];
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        //GET group informations
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch 1 response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            let assets = [];
                                            let playlists = res['data']['playlists'];
                                            for(let i =0;i<playlists.length;i++){
                                                let url2=baseUrl+'playlists/'+playlists[i]['name'];
                                                requestOptions = {
                                                    method: 'GET',
                                                    headers: headers,
                                                    redirect: 'follow'
                                                };
                                                res = await fetch(url2, requestOptions);
                                                if(!res.ok){
                                                    node.error("fetch 2, index "+i+", response not ok : "+res.statusText)}
                                                else{
                                                    res = await res.json();
                                                    assets.push("__"+playlists[i]['name']+".json");
                                                    assets.push(res['data']['templateName']);
                                                    res['data']['assets'].map(x=>{assets.push(x['filename']); return x;});
                                                }
                                            }
                                            assets=[...new Set(assets)];
                                            let raw=JSON.stringify({
                                                "playlists":playlists,
                                                "assets":assets,
                                                "deploy": true,
                                                "shuffleContent": payloadObject['Shuffle playlists']=='true',
                                                "combineDefaultPlaylist": payloadObject['Combine playlists']=='true'
                                            });
                                            headers.append("Content-Type", "application/json");
                                            requestOptions = {
                                                method: 'POST',
                                                headers: headers,
                                                redirect: 'follow',
                                                body: raw
                                                };
                                            res = await fetch(url, requestOptions);
                                            if(!res.ok){
                                                node.error("fetch 3 response not ok : "+res.statusText)}
                                            else{
                                                res = await res.json();
                                                msg.payload=res; 
                                                node.send(msg);
                                            }   
                                              
                                        }   
                                        break;
                                    

                                    default:
                                        break;
                                }
                                    
                                    
                                
                                break;

                            case 'players':
                                
                                switch (method) {
                                    case 'GET ALL':
                                        
                                        url+='players';
                                        requestOptions={
                                            method :'GET',
                                            headers : headers,
                                        }
                                        res = await fetch(url,requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }     
                                        break;
                                    
                                    case 'CREATE':
                                        url+='players';  
                                
                                        headers.append("Content-Type", "application/json");
                                        let raw=JSON.stringify({
                                            
                                            "name": payloadObject["Player's name"],
                                            "TZ": payloadObject["Timezone"],
                                            "cpuSerialNumber": payloadObject["Serial number"],
                                            "managed": payloadObject["Managed"],
                                            "configLocation": payloadObject["Location"],
                                            "labels": [
                                            
                                            ],
                                            "group": {
                                            "_id": payloadObject["Group's id"],
                                            "name": payloadObject["Group's name"]
                                            }
                                            
                                            
                                        });
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            redirect: 'follow',
                                            body: raw
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }     
                                        break;
                                    
                                    case 'GET ONE':
                                        url+='players/';  
                                        url+=payloadObject["Player's id"];
                                        requestOptions = {
                                            method: 'GET',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }     
                                        break;
                                    
                                    case 'DELETE':
                                        url+='players/';  
                                        url+=payloadObject["Player's id"];
                                        requestOptions = {
                                            method: 'DELETE',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = await fetch(url, requestOptions)
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }     
                                        break;

                                    case 'TV ON/OFF':
                                        url+='pitv/';  
                                        headers.append("Content-Type", "application/json");
                                        url+=payloadObject["Player's id"];
                                        let boolTemp=true;
                                        if(payloadObject["TV ON"]=="true"){boolTemp=false;}
                                        const bodyPlayer=JSON.stringify({"status": boolTemp});
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            redirect: 'follow',
                                            body: bodyPlayer
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }     
                                        break;
                                    
                                    case 'UPDATE':
                                        url+='players/';  
                                        url+=payloadObject["Player's id"];
                                        headers.append("Content-Type", "application/json");
                                        let raw2=JSON.stringify({
                                            
                                            "name": payloadObject["Player's name"],
                                            "TZ": payloadObject["Timezone"],
                                            "cpuSerialNumber": payloadObject["Serial number"],
                                            "managed": payloadObject["Managed"],
                                            "configLocation": payloadObject["Location"],
                                            "labels": [
                                                
                                            ],
                                            "group": {
                                                "_id": payloadObject["Group's id"],
                                                "name": payloadObject["Group's name"]
                                            }
                                            
                                            
                                        });
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            redirect: 'follow',
                                            body: raw2
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }     
                                        break;
                                    
                                    case 'CONTROLS':
                                        url+='playlistmedia/';  
                                        url+=payloadObject["Player's id"];
                                        url+='/';  
                                        let control="";
                                        if(payloadObject["Command"]=="Toggle pause"){control="pause"}
                                        else if(payloadObject["Command"]=="Next asset"){control="forward"}
                                        else if(payloadObject["Command"]=="Previous asset"){control="backward"}
                                        url+=control;
                                        headers.append("Content-Type", "application/json");
                                        
                                        requestOptions = {
                                            method: 'POST',
                                            headers: headers,
                                            redirect: 'follow'
                                            };
                                        res = await fetch(url, requestOptions);
                                        if(!res.ok){
                                            node.error("fetch response not ok : "+res.statusText)}
                                        else{
                                            res = await res.json();
                                            msg.payload=res; 
                                            node.send(msg);
                                        }     
                                        break;
                                    default:
                                        break;
                                }
                                    
                                    
                                
                                break;
                            
                            default:
                                break;
                        }
                    }
                    catch(e){
                        node.error(e+" "+e.cause)};
                })();
        
            }
            else{
                msg.payload="no valid token issued";
                node.send(msg);
            }

        });
    }
    RED.nodes.registerType("pisignage-services",LowerCaseNode);

    
}

