let currUser

function searchFriend(){
    let search = document.getElementById("addFriend").value; //Find the letters that makes up the name of the friend they may be searching for
    let div = document.getElementById("searchFriends")
    let obj = {}
    obj.search = search
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){
            let users = JSON.parse(this.responseText)
            console.log(users)
            div.innerHTML =""
            if(search != ""){
                for(i in users){  //Renders html that can load all potential users that can be addded as a friend
                    div.innerHTML += "<div id = "+users[i].username+">"+users[i].username+"<button id = add"+users[i].username+" onclick = addFriend("+users[i].username+")> Add Friend </button></div><br>"
                }
            }
        }
    }
    xhr.open("POST","/client.js",true) //Sends a post request that gets all the users that fit the criteria that was searched for
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send(JSON.stringify(obj))
}

function addFriend(user){ //User clicked the button to add another user as a friend
    let obj={}
    obj.addUser = user.id
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){
            console.log("Finished")
            alert("Friend Request Sent!")
        }
    }
    xhr.open("POST","/addFriend",true)
    xhr.setRequestHeader("Content-Type","application/json")
    console.log(JSON.stringify(obj))
    xhr.send(JSON.stringify(obj))
}

function acceptFriend(user){ //User clicked the button to accept a friend request
    let addUser = user.id.slice(2) //Gets actual username
    let obj = {}
    obj.accept = addUser 
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){ 
            alert("Friend Request Accepted")  
            init()
        }
    }
    xhr.open("POST","/acceptFriend",true)
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send(JSON.stringify(obj)) //Tells the server that the friend request was accepted
}

function declineFriend(user){ //User clicked the button to decline a friend request
    let declineUser = user.id.slice(2) //Gets actual username
    let obj = {}
    obj.decline = declineUser
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){  
            init() 
            alert("Friend Request Declined")
        }
    }
    xhr.open("POST","/declineFriend",true)
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send(JSON.stringify(obj)) //Tells server friend request was denied
}

function tradeWith(){
    let select = document.getElementById("sel")
    let tradeDiv=document.getElementById("trade")
    let obj = {}
    obj.user = select.value //User that trade is being sent to
    if(select.value ==""){ //If no one is selected dont load the cards available to trade
        tradeDiv.innerHTML=""
    }else{ //If someone is selected to trade with
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){
            let trade = JSON.parse(this.responseText)  //Gets your availbe cards and the user your are trying to trade with's available cards
            tradeDiv.innerHTML = "<h3>Your Cards</h3>" 
            let yourCards = document.createElement("div") //Div where your cards will be displayed
            yourCards.id = "yourCards"
            
            for(i in trade.yourCards){ //Adds yours cards to the html and a checkbox for if you wanna trade that cards
                yourCards.innerHTML+= "<div id=your"+trade.yourCards[i].name+">"+trade.yourCards[i].name+"<input type=checkbox id =tradeYour"+trade.yourCards[i].name+"></input></div>"
            }
            tradeDiv.appendChild(yourCards)
            tradeDiv.innerHTML += "<h3>"+select.value+"'s Cards</h3>" 
            let theirCards = document.createElement("div") //Html that is going to contain all of their cards and a way to add them to the trade
            theirCards.id = "theirCards"
            for(i in trade.yourCards){
                theirCards.innerHTML+= "<div id=their"+trade.theirCards[i].name+">"+trade.theirCards[i].name+"<input type=checkbox id =tradeYour"+trade.theirCards[i].name+"></input></div>"
            }
            tradeDiv.appendChild(theirCards)
            tradeDiv.innerHTML +="<button id = sendTrade onclick = sendTrade()>Send Trade</button></div>"
        }
    }
    xhr.open("POST","/trade",true)
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send(JSON.stringify(obj))
    }

}

function sendTrade(){ //Comes here when button is pressed to send the trade
    let yourCardDivs = document.getElementById("yourCards")
    let theirCardDivs = document.getElementById("theirCards")
    let yourCards = yourCardDivs.getElementsByTagName("div")
    let theirCards = theirCardDivs.getElementsByTagName("div")
    let trade = {}
    trade.youGive = []
    trade.youRecieve = []
    trade.theyAccept = false
    trade.tradeWith = document.getElementById("sel").value
    trade.tradeFrom = currUser.username
    for(i in yourCards){ //Iterates over all your cards in the ongoing trade and checks which card's checkboxes were checked 
        let checkBox=yourCards[i].firstElementChild
        if(checkBox != undefined){
            if (checkBox.checked ==true){ //If checkbox is checked the card is added to the trade
                trade.youGive.push(yourCards[i].innerText)
            }
        }

    }
    for(i in theirCards){//Iterates over all their cards in the ongoing trade and checks which card's checkboxes were checked 
        let checkBox=theirCards[i].firstElementChild
        if(checkBox != undefined){
            if (checkBox.checked ==true){//If checkbox is checked the card is added to the trade
                trade.youRecieve.push(theirCards[i].innerText)
            }
        }

    }

    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange=function(){
        if(this.status ==200 && this.readyState == 4){
            alert("Trade sent")
            init()
        }
    }
    xhr.open("POST","/sendTrade",true) //Trade is sent to the server
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send(JSON.stringify(trade)) 
}

function acceptTrade(div){ //When other user accepted the trade you sent
    let name = div.id.slice(5) //Gets actual name of the user

    for(i in currUser.inTradeReq){ //Iterates over trades you have recieved
        if(currUser.inTradeReq[i].tradeFrom == name){ //If you hit the accept button on this trade
            currUser.inTradeReq[i].theyAccept = true; //Sets the trade staus to accepted
            postTradeResponse(currUser.inTradeReq[i]) //Posts the trade to the server
            
        }
    }
}

function declineTrade(div){
    let name = div.id.slice(5)
    for(i in currUser.inTradeReq){ //Iterates over trades you have recieved
        if(currUser.inTradeReq[i].tradeFrom == name){//If you hit the decline button on this trade
            postTradeResponse(currUser.inTradeReq[i]) //Leaves trade status as not accepted and sends it back to the server
        }
    }
}

function postTradeResponse(trade){ //Regardless of if the trade was accepted or not this trade is sent to the server and proccessed
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){
            alert("Trade has been completed")
            init()
        }
    }
    xhr.open("POST","/respondTrade",true)
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send(JSON.stringify(trade))
}

function getCurrUser(){
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){
            return JSON.parse(this.responseText)
        }
    }
    xhr.open("GET","/currentUser",true)
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send()
}

function init(){ //Gets the current user that is logged in and loads all the html that is required to show for that user
    let div = document.getElementById("friendReqs")
    let friends = document.getElementById("friendsList")
    //Get the user that is logged in
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function(){
        if(this.status==200 && this.readyState == 4){
            user = JSON.parse(this.responseText) //User that is logged in
            currUser = JSON.parse(this.responseText)
            console.log(user.inFriendReqs)
            div.innerHTML=""
            for(i in user.inFriendReqs){ //Prints out all the friend requests they have recieved and provides and accept and decline option 
                div.innerHTML += "<div id = FR"+user.inFriendReqs[i] +">"+user.inFriendReqs[i]+"<button id = accept"+user.inFriendReqs[i]+" onclick = acceptFriend(FR"+user.inFriendReqs[i]+")> Accept </button><button id=decline"+user.inFriendReqs[i]+" onclick = declineFriend(FR"+user.inFriendReqs[i]+")>Decline</button></div><br>"
            }
            let friends = document.getElementById("friendsList")
            friends.innerHTML = ""
            for(i in user.friends){ //Prints all friends to the user's page
                friends.innerHTML += "<div id = friend_"+user.friends[i]+">"+user.friends[i]+"</div><br>"
            }
            let select=document.getElementById("sel")
            let opt = document.createElement('option')
            opt.value = ""
            opt.innerText = "" //Leaves a blank option
            select.appendChild(opt)
            for(i in user.friends){ //Creates a select option to trade with each user on the friends list
                let opt = document.createElement('option')
                opt.value = user.friends[i]
                opt.innerText = user.friends[i]
                select.appendChild(opt)
            }
            select.addEventListener("change",tradeWith) //Adds onchange event for the select. When iots changed it loads the html for the cards that can be traded with this user
            let tradeReqsDiv = document.getElementById("pendingTrades")
            for(i in user.inTradeReq){ //Loads html for all trade requests that you have recieved
                let tradeDiv = document.createElement('div')
                tradeDiv.id = "trade"+user.inTradeReq[i].tradeFrom
                let h5 = document.createElement('h5')
                h5.innerText = "Trade From "+user.inTradeReq[i].tradeFrom
                tradeReqsDiv.appendChild(h5)
                tradeDiv.innerHTML = "You Recieve:<br>" //Html for the cards you will get back in this trade
                for(j in user.inTradeReq[i].youGive){
                    tradeDiv.innerHTML+= ""+user.inTradeReq[i].youGive[j]
                    tradeDiv.innerHTML+="<br>"
                }
                tradeDiv.innerHTML+= "You Give Up:<br>" //Html for the cards you have to give uup for the trade
                for(j in user.inTradeReq[i].youRecieve){
                    tradeDiv.innerHTML+=user.inTradeReq[i].youRecieve[j]
                    tradeDiv.innerHTML+="<br>"
                }
                //Buttons to accept/decline  the trade
                tradeDiv.innerHTML += "<button id = accept"+user.inTradeReq[i].tradeFrom+" onclick = acceptTrade(trade"+user.inTradeReq[i].tradeFrom+")>Accept</button><button id=decline"+user.inTradeReq[i].tradeFrom+" onclick = declineTrade(trade"+user.inTradeReq[i].tradeFrom+")>Decline</button></div>"
                tradeReqsDiv.appendChild(tradeDiv)
            }
            
        }
    }
    xhr.open("GET","/currentUser",true)
    xhr.setRequestHeader("Content-Type","application/json")
    xhr.send()
}