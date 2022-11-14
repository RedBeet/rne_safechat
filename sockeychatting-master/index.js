window.onload = function(){
    var nickName = "";
    var roomName = "";
    var handle = null;
    var socket = io.connect(); //웹소켓서버에 연결한다.
    function encodeByAES56(key, data){
        const cipher = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(""),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        return cipher.toString();
    };
    function decodeByAES256(key, data){
        const cipher = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(""),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        return cipher.toString(CryptoJS.enc.Utf8);
    };
    $("#nicknameBtn").on("click",function(){
        var nicknameValue = $("input[name='nickname']").val();
        nickName = nicknameValue;
        socket.emit("nickNameCheck",{name:nicknameValue});
    });
    socket.on("nullError",function(result){
        alert(result);
    });
    socket.on("sameNameError",function(result){
        alert(result);
    });
    socket.on("nickNameCheckComplete",function(){
        $("#chatBox").removeClass("chatDisabled").addClass("chatabled");
        $("#nickNameForm").css("display","none");
        $("#sendMessage").hide(); $("#closing").hide();
        $("#ramdomChatFindBtn").show();
        clientCounting();
    });

    
    $("#ramdomChatFindBtn").on("click",function(){
        $("#chat").html("");
        socket.emit("randomChatFindClick",{name:nickName});
    })
    socket.on("randomChatFindClickComplete",function(){
        $("#chat").html("").append("<li>대화상대를 찾고있습니다...</li>");
        startFinding(); //실제로 대화상대찾기 시작
    });
    socket.on("randomChatFiningComplete",function(data){
        stopFinding(); //찾는걸 성공했으니 찾는걸 멈춰야댐.
        $("#chat").html("").append("<li><p>대화방에 입장했습니다!!</p><hr></li>");
        $("#sendMessage").show(); $("#closing").show();
        $("#ramdomChatFindBtn").hide();
        roomName = data;
    });

    $("#sendMessage").on("click",function(){
        var content = $("#content").val();
        console.log(content);
        if(!content){
            alert("대화내용을 입력해주세요");
            return ;
        }

        var str = "";
        str += "<li>";
        str += "<strong>"+nickName+"</strong>";
        str += "<p>"+content+"</p>";
        str += "<hr>";
        str += "</li>";
        const k = "key";
        const rk = k.padEnd(32, " "); // AES256은 key 길이가 32자여야 함
        const b = words;
        const eb = this.encodeByAES56(rk, b);
        socket.emit("message",{roomName:roomName, data:eb});
        $("#content").val("");
        $("#chat").scrollTop($("#chat")[0].scrollHeight);
    });
    socket.on("message",function(data){
        const k = "key"; // 암호화에서 사용한 값과 동일하게 해야함
        const rk = k.padEnd(32, " "); // AES256은 key 길이가 32자여야 함
        const eb = data;
        const b = this.decodeByAES56(rk, eb);
        $("#chat").append(b);
    });

    $("#closing").on("click",function(){
        socket.emit("chatClosingBtn",{roomName:roomName});
    })
    socket.on("chatEnd",function(data){
        $("#chat").append("<li><p>대화방이 종료되었습니다</p><hr></li>");
        $("#sendMessage").hide(); $("#closing").hide();
        $("#ramdomChatFindBtn").show();
        socket.emit("ChatClosing",{roomName:roomName});
    });
    
    socket.on("discWhileChat",function(){
        socket.emit("chatClosingBtn",{roomName:roomName});
    });
    
    socket.on("clientsCount",function(data){
        $(".clientsCount").html(data);
    })

    function startFinding(){
        if(handle == null){
            handle = setInterval(function(){
                socket.emit("randomChatFining",{name:nickName});
            },500);
        }
    }

    function stopFinding(){
        clearInterval(handle);
        handle = null;
    }

    function clientCounting(){
        setInterval(function(){
            socket.emit("clientsCount");
        },1500); //1.5초마다 clientsCount이벤트발생
    }
}
