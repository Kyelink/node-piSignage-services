const { MIMEType } = require('util');


module.exports = function(RED) {

    function RemoteServerNode(n) {
        RED.nodes.createNode(this,n);
        this.username = n.username;
        this.password = n.password;
        this.host = n.host;
    }
    RED.nodes.registerType("client-pisignage-credentials",RemoteServerNode);


    function LowerCaseNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.creds = RED.nodes.getNode(config.creds);
        this.method = config.method;
        this.iddtype = config.iddtype;
        this.idd = config.idd;
        
        
        node.on('input', function(msg) {
            
			if(config.iddtype === "msg"){
				var buildText = eval("msg." + config.idd)
				this.idd = buildText;
            }else if(config.iddtype === "flow"){
                this.idd = this.context().flow.get(config.idd);
			}else if(config.iddtype === "global"){
                this.idd = this.context().global.get(config.idd);
			}else{
				this.idd = config.idd;
			}

            const content = config.content;
            const meth=config.methodForFiles;
            const meth2=config.methodForPlaylists;
            var url=this.creds.host+'/api/';

            let headers = new Headers();

            headers.set('Authorization', 'Basic ' + btoa(this.creds.username + ":" + this.creds.password));
            switch (content) {
                case 'files':
                    
                    switch (meth) {
                        case 'GET ALL':
                            url+='files';
                            const optionsGET={
                                method :'GET',
                                headers : headers,
                            }
                            fetch(url,optionsGET)
                            .then(x=>x.json())
                            .then(json=>{msg.payload=json; node.send(msg);});    
                            break;
                        case 'POST FROM LOCAL':
                            url+='files';
                            const fs = require('fs'); 
                            const mime = require('mime-types');
                                   
                            let path="";         
                            switch(config.pathType){
                                case "str":
                                    path=config.path;                                    
                                    break;
                                case "msg":
                                    path=eval("msg." + config.path);
                                    break
                                case "flow":
                                    path= this.context().flow.get(config.path);
                                    break
                                case "global":
                                    path= this.context().global.get(config.path);
                                    break                         
                                default:
                                    break;
                            }
                            var formdata = new FormData();
                            
                            let mt=mime.lookup(path);
                            
                            const file=fs.openAsBlob(path,{ type: mt })
                            .then(f=>{
                                formdata.append("assets",f, path);
                                var requestOptions = {
                                    method: 'POST',
                                    headers: headers,
                                    body: formdata,
                                    redirect: 'follow'
                                    };
                                    
                                fetch(url, requestOptions)
                                .then(response => {if(response.ok){return response.json()}else{return response;}})
                                .then(json=>{
                                    const file=json;

                                    headers.append("Content-Type", "application/json");
                                    const raw = JSON.stringify({
                                        "files": json['data'],
                                        "categories": []
                                    });

                                    const requestOptions = {
                                    method: "POST",
                                    headers: headers,
                                    body: raw,
                                    redirect: "follow"
                                    };

                                    fetch(this.creds.host+"/api/postupload", requestOptions)
                                    
                                    .then(response => {console.log(response);if(response.ok){return response.json()}else{msg.payload=response;node.error(msg);}})
                                    .then(json=>{msg.payload=file;node.send(msg);})
                                    
                                })
                                        
                            });
                               
                            break;
                        case 'DELETE':
                            headers.set('Content-Type', 'application/json;');
                            url+='files';
                            url+='/';         
                            switch(config.nameType){
                                case "str":
                                    url+=config.name;                                    
                                    break;
                                case "msg":
                                    url+=eval("msg." + config.name);
                                    break
                                case "flow":
                                    url+= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    url+= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            var requestOptions = {
                                method: 'DELETE',
                                headers: headers,
                                // redirect: 'follow'
                                };
                            // msg.payload=url;
                            // node.send(msg);
                            fetch(url, requestOptions)
                            .catch(err=>{node.error(err);})
                            .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                else{console.log('deleting something'); return response.json();}})
                            .then(json=>{console.log(json);msg.payload=json;node.send(msg);})

                            break;

                        case 'GET ONE':
                            url+='files';
                            url+='/';         
                            switch(config.nameType){
                                case "str":
                                    url+=config.name;                                    
                                    break;
                                case "msg":
                                    url+=eval("msg." + config.name);
                                    break
                                case "flow":
                                    url+= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    url+= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            var requestOptions = {
                                method: 'GET',
                                headers: headers,
                                redirect: 'follow'
                                };
                            // msg.payload=url;
                            // node.send(msg);
                            fetch(url, requestOptions)
                            .catch(err=>{node.error(err);})
                            .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                else{console.log('getting something'); return response.json();}})
                            .then(json=>{console.log(json);msg.payload=json;node.send(msg);})

                            break;

                        
                        case 'RENAME':
                            url+='files/';
                            headers.append("Content-Type", "application/json");
                            switch(config.nameType){
                                case "str":
                                    url+=config.name;                                    
                                    break;
                                case "msg":
                                    url+=eval("msg." + config.name);
                                    break
                                case "flow":
                                    url+= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    url+= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            let newName="";
                            switch(config.nameFileType){
                                case "str":
                                    newName=config.nameFile;                                    
                                    break;
                                case "msg":
                                    newName=eval("msg." + config.nameFile);
                                    break
                                case "flow":
                                    newName= this.context().flow.get(config.nameFile);
                                    break
                                case "global":
                                    newName= this.context().global.get(config.nameFile);
                                    break                         
                                default:
                                    console.log('qfgbnsegdqdfgdqs');
                                    break;
                            }
                            const body=JSON.stringify({
                                    "newname": newName,
                                });
                            var requestOptions = {
                                method: 'POST',
                                headers: headers,
                                redirect: 'follow',
                                body: body
                                };
                            // msg.payload=url;
                            // node.send(msg);
                            console.log(body);
                            fetch(url, requestOptions)
                            // .catch(err=>{node.error(err);})
                            .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                else{return response.json();}})
                            .then(json=>{console.log(json);msg.payload=json;node.send(msg);})

                            break;
                        
                        
                    
                        default:
                            break;
                    }
                        
                        
                    
                    break;
                
                case 'playlists':
                    
                    switch (meth2) {
                        case 'GET ALL':
                            url+='playlists';
                            const optionsGET={
                                method :'GET',
                                headers : headers,
                            }
                            fetch(url,optionsGET)
                            .then(x=>x.json())
                            .then(json=>{msg.payload=json; node.send(msg);});    
                            break;
                        case 'CREATE':
                            url+='playlists/';  
                            let plName="";
                            switch(config.nameType){
                                case "str":
                                    plName=config.name;                                    
                                    break;
                                case "msg":
                                    plName=eval("msg." + config.name);
                                    break
                                case "flow":
                                    plName= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    plName= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            headers.append("Content-Type", "application/json");
                            let raw=JSON.stringify({
                                
                                    "file": plName
                                  
                                  
                            });
                            var requestOptions = {
                                method: 'POST',
                                headers: headers,
                                redirect: 'follow',
                                body: raw
                                };
                            // msg.payload=url;
                            // node.send(msg);
                            fetch(url, requestOptions)
                            .catch(err=>{node.error(err);})
                            .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                else{ return response.json();}})
                            .then(json=>{console.log(json);msg.payload=json;node.send(msg);})

                           
                               
                            break;
                        case 'DELETE':
                            url+='playlistfiles';  
                            let plName2="";
                            switch(config.nameType){
                                case "str":
                                    plName2=config.name;                                    
                                    break;
                                case "msg":
                                    plName2=eval("msg." + config.name);
                                    break
                                case "flow":
                                    plName2= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    plName2= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            headers.append("Content-Type", "application/json");

                            let url2=this.creds.host+'/api/files/__'+plName2+".json";
                            fetch(url2,{method: 'DELETE',
                            headers: headers})
                            .then(x=>{
                                let raw2=JSON.stringify({
                                    
                                        "playlist": plName2,
                                        "assets":[]
                                    
                                    
                                });
                                var requestOptions = {
                                    method: 'POST',
                                    headers: headers,
                                    redirect: 'follow',
                                    body: raw2
                                    };
                                // msg.payload=url;
                                // node.send(msg);
                                fetch(url, requestOptions)
                                .catch(err=>{node.error(err);})
                                .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                    else{ return response.json();}})
                                .then(json=>{console.log(json);msg.payload=json;node.send(msg);})
                                })
                           
                               
                            break;

                        case 'GET ONE':
                            url+='playlists/';  
                            switch(config.nameType){
                                case "str":
                                    url+=config.name;                                    
                                    break;
                                case "msg":
                                    url+=eval("msg." + config.name);
                                    break
                                case "flow":
                                    url+= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    url+= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            var requestOptions = {
                                method: 'GET',
                                headers: headers,
                                redirect: 'follow'
                                };
                            // msg.payload=url;
                            // node.send(msg);
                            fetch(url, requestOptions)
                            .catch(err=>{node.error(err);})
                            .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                else{console.log('getting something'); return response.json();}})
                            .then(json=>{console.log(json);msg.payload=json;node.send(msg);})

                            break;

                        case 'ADD FILE':
                            url+='playlists/';  
                            let playlistName="";
                            switch(config.nameType){
                                case "str":
                                    playlistName=config.name;                                    
                                    break;
                                case "msg":
                                    playlistName=eval("msg." + config.name);
                                    break
                                case "flow":
                                    playlistName= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    playlistName= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            url+=playlistName;
                            var requestOptions = {
                                method: 'GET',
                                headers: headers,
                                redirect: 'follow'
                                };
                            // msg.payload=url;
                            // node.send(msg);
                            fetch(url, requestOptions)
                            .catch(err=>{node.error(err);})
                            .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                else{console.log('getting something'); return response.json();}})
                            .then(json=>{
                                let nameFileToAdd="";
                                switch(config.nameFileToAddType){
                                    case "str":
                                        nameFileToAdd=config.nameFileToAdd;                                    
                                        break;
                                    case "msg":
                                        nameFileToAdd=eval("msg." + config.nameFileToAdd);
                                        break
                                    case "flow":
                                        nameFileToAdd= this.context().flow.get(config.nameFileToAdd);
                                        break
                                    case "global":
                                        nameFileToAdd= this.context().global.get(config.nameFileToAdd);
                                        break                         
                                    default:
                                        break;
                                }
                                let duration=10;
                                switch(config.durationType){
                                    case "num":
                                        duration=config.duration;                                    
                                        break;
                                    case "msg":
                                        duration=eval("msg." + config.duration);
                                        break
                                    case "flow":
                                        duration= this.context().flow.get(config.duration);
                                        break
                                    case "global":
                                        duration= this.context().global.get(config.duration);
                                        break                         
                                    default:
                                        break;
                                }


                                console.log(json);
                                let assetsWithData= json['data']['assets'];
                                let assetsNoData= assetsWithData.map(x=>x['filename']);
                                assetsWithData.push({"filename":nameFileToAdd,"selected":false,"isVideo":false,"option":{"main":false},"duration":duration});
                                assetsNoData.push(nameFileToAdd);
                                const bodyReq1=JSON.stringify({"assets":assetsWithData});
                                headers.append("Content-Type", "application/json");
                                var options = {
                                    method: 'POST',
                                    headers: headers,
                                    redirect: 'follow',
                                    body: bodyReq1
                                    };
                                fetch(url, options)
                                .catch(err=>{node.error(err);})
                                .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                    else{console.log('getting something'); return response.json();}})
                                .then(rr=>{
                                    let urlReq2=this.creds.host+'/api/playlistfiles'
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
                                fetch(urlReq2, options2)
                                .catch(err=>{node.error(err);})
                                .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                    else{console.log('getting something'); return response.json();}})
                                .then(r=>{msg.payload=r;node.send(msg);})

                                })
                                
                                

                               
                            })
                            break;
                    
                        case 'REMOVE FILE':
                            url+='playlists/';  
                            let playlistName2="";
                            switch(config.nameType){
                                case "str":
                                    playlistName2=config.name;                                    
                                    break;
                                case "msg":
                                    playlistName2=eval("msg." + config.name);
                                    break
                                case "flow":
                                    playlistName2= this.context().flow.get(config.name);
                                    break
                                case "global":
                                    playlistName2= this.context().global.get(config.name);
                                    break                         
                                default:
                                    break;
                            }
                            url+=playlistName2;
                            var requestOptions = {
                                method: 'GET',
                                headers: headers,
                                redirect: 'follow'
                                };
                            // msg.payload=url;
                            // node.send(msg);
                            fetch(url, requestOptions)
                            .catch(err=>{node.error(err);})
                            .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                else{console.log('getting something'); return response.json();}})
                            .then(json=>{
                                let nameFileToAdd="";
                                switch(config.nameFileToAddType){
                                    case "str":
                                        nameFileToAdd=config.nameFileToAdd;                                    
                                        break;
                                    case "msg":
                                        nameFileToAdd=eval("msg." + config.nameFileToAdd);
                                        break
                                    case "flow":
                                        nameFileToAdd= this.context().flow.get(config.nameFileToAdd);
                                        break
                                    case "global":
                                        nameFileToAdd= this.context().global.get(config.nameFileToAdd);
                                        break                         
                                    default:
                                        break;
                                }
                                
                                let assetsWithData= json['data']['assets'];
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
                                fetch(url, options)
                                .catch(err=>{node.error(err);})
                                .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                    else{console.log('getting something'); return response.json();}})
                                .then(rr=>{
                                    let urlReq2=this.creds.host+'/api/playlistfiles'
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
                                fetch(urlReq2, options2)
                                .catch(err=>{node.error(err);})
                                .then((response) => {if (!response.ok){node.error(response.statusText + ", status code : (" + response.status+")");}
                                    else{console.log('getting something'); return response.json();}})
                                .then(r=>{msg.payload=r;node.send(msg);})

                                })
                                
                                

                                
                            })
                            break;
                        default:
                            break;
                    }
                        
                        
                    
                    break;
            
                default:
                    break;
            }




               


        });
    }
    RED.nodes.registerType("pisignage-services",LowerCaseNode);

    
}

