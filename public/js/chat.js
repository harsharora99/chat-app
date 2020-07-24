//io()
const socket = io()


//Elements
const $messageForm = document.querySelector('#messageform')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} = Qs.parse(location.search, {ignoreQueryPrefix:true})  //parses the query string


const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //height of the new message 
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //console.log(newMessageMargin)
    //console.log(newMessageStyles)

    //visible height
    const visibleHeight = $messages.offsetHeight
    
    //height of messages container
    const containerHeight = $messages.scrollHeight
    
    //how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop=$messages.scrollHeight
    }
}

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated!',count)
// })

// document.querySelector("#increment").addEventListener('click', () => {
//     console.log("Clicked!")
//     socket.emit("increment")  //increment is the name of event(we can name the event anything)
// })

socket.on('message', (message) => {
    console.log(message)

    // const html = Mustache.render(messageTemplate)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    // console.log(room)
    // console.log(users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()  // prevent default page refresh on submitting a form
    
    $messageFormButton.setAttribute('disabled','disabled')
    
    //const message = document.querySelector('input').value
    const message = e.target.elements.message.value  //e.target refers to the form on which the event is set
    // socket.emit('sendMessage',message)
    socket.emit('sendMessage', message, (error) => {   //with acknowledgement
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()  //returns focus of the cursor to the input field
        if (error) {
           return console.log(error)
        }
        console.log('Message delivered!')
    })
})


$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) //this feature  is provided by a browser(geolocation api of browser)
    {
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {   //asynchronous function
        //console.log(position)
        socket.emit('sendLocation', {
        latitude: position.coords.latitude,
               longitude:position.coords.longitude
        }, () => {
                $sendLocationButton.removeAttribute('disabled')
                console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href='/'   //redirects to root of the site(join page)
    }
})