const canvas = document.getElementById("field")
const ratingscanvas = document.getElementById("ratings")
const fieldHeight = window.innerHeight - 10
let ctx
let bctx
const colors = {
	"7":["#E3E3E3","#50DEFD","#E3E3E3","#FFF716","#E3E3E3","#50DEFD","#E3E3E3"],
	"6":["#E3E3E3","#50DEFD","#E3E3E3","#E3E3E3","#50DEFD","#E3E3E3"],
	"5":["#50DEFD","#E3E3E3","#FFF716","#E3E3E3","#50DEFD"],
	"4":["#50DEFD","#E3E3E3","#E3E3E3","#50DEFD"],
}

let options = {
	width: 100,
	hitPosition: 20,
	scrollSpeed: 448,
	BPM: 120,
	columns: 7,
	controls: {
		"7":["KeyS","KeyD","KeyF","Space","KeyJ","KeyK","KeyL"],
		"6":["KeyS","KeyD","KeyF","KeyJ","KeyK","KeyL"],
		"5":["KeyD","KeyF","Space","KeyJ","KeyK"],
		"4":["KeyD","KeyF","KeyJ","KeyK"]
	},
	hitWindow:100,
}
let saved = localStorage.getItem("LNtr-options")
if(saved!==null){
	options = JSON.parse(saved)
}

let tmp = {
	notes: [],
	lastNotes: Array.from({length: options.columns}, () => 0),
	lastAdded: 0,
	noteheight: 0,
	pressCount: 0,
	positionOffset: -1*options.hitPosition,
	interval: undefined,
	bitmap: undefined,
	state:[],
	stateChange:[],
	failedColumns:[],
	combo:0,
	bestcombo:0,
}

function setup(){
	document.getElementById("field").click()
	canvas.height = fieldHeight
	canvas.width = (options.width * options.columns)
	ratingscanvas.height = fieldHeight
	ratingscanvas.width = (options.width * options.columns)
	ctx = canvas.getContext("2d")
	bctx = ratingscanvas.getContext("2d")
	//height per ms * ms per bpm
	tmp.noteheight = (fieldHeight / options.scrollSpeed) * (1000*(60/options.BPM))
	tmp.state = Array.from({length: options.columns}, () => 0)
	tmp.stateChange = [...tmp.state] 
	tmp.failedColumns = Array.from({length: options.columns}, () => 1)
	tmp.notes = Array.from({length: 30}, 
		() => Array.from({length: options.columns}, 
			() => Math.round(Math.random())
		)
	)
	generateNotes()
	clearInterval(tmp.interval)
	tmp.interval = setInterval(() => {
		generateNotes()
	}, 1000*(60/options.BPM));

	document.getElementById("bpm").value = options.BPM
	document.getElementById("scrollspeed").value = options.scrollSpeed
	document.getElementById("hitposition").value = options.hitPosition
	document.getElementById("columns").value = options.columns
	document.getElementById("columnwidth").value = options.width
	document.getElementById("hitwindow").value = options.hitWindow
}

function draw() {
	const now = Date.now()
	const diff = now - tmp.lastUpdate
	tmp.lastUpdate = now

	//clear field
	ctx.fillStyle = "black"
	ctx.rect(0,0,(options.width * options.columns),fieldHeight)
	ctx.fill()

	//draw notes :DDD
	tmp.positionOffset += (fieldHeight / options.scrollSpeed)*diff
	for(let x=0; x<20; x++){
		const notes = tmp.notes[x]
		if(((tmp.noteheight*x)-tmp.positionOffset)>fieldHeight)break
		for(let i=0; i < notes.length; i++){
			if(notes[i] === 1){
				ctx.beginPath()
				ctx.rect((i*(options.width * options.columns)/options.columns), (tmp.noteheight*x)-tmp.positionOffset,((options.width * options.columns)/options.columns),tmp.noteheight+1)
				ctx.closePath()
				ctx.fillStyle = colors[options.columns][i]
				ctx.fill()
				if(getLnLength(i)>=x && tmp.failedColumns[i]===0){
					ctx.fillStyle="#00000030"
					ctx.fill()
				}
			}
		}
	}

	//draw column separators
	ctx.beginPath()
	for(let i=1; i<options.columns;i++){
		ctx.moveTo(i * (options.width * options.columns) / options.columns, 0)
		ctx.lineTo(i * (options.width * options.columns) / options.columns, fieldHeight)
	}
	ctx.closePath()
	ctx.strokeStyle = "gray"
	ctx.lineWidth = "1"
	ctx.stroke()

	//draw judgement line
	for(let i=0; i<options.columns; i++){
		ctx.beginPath()
		ctx.moveTo(i*(options.width * options.columns)/options.columns, options.hitPosition)
		ctx.lineTo((i+1)*(options.width * options.columns)/options.columns,options.hitPosition)
		ctx.closePath()
		if(tmp.state[i]===0){
			ctx.lineWidth = "2"
			ctx.strokeStyle = "white"
			ctx.stroke()
		} else {
			ctx.lineWidth = "5"
			ctx.strokeStyle = "green"
			ctx.stroke()
			if(tmp.failedColumns[i]===1){
				ctx.rect(i*(options.width * options.columns)/options.columns, options.hitPosition, (options.width * options.columns)/options.columns, -1*options.hitPosition)
				ctx.fillStyle="black"
				ctx.fill()
			}
		}
		

	}

	requestAnimationFrame(draw)
}

function generateNotes(){
	let lastState = [...tmp.state]
	tmp.lastNotes = [...tmp.notes[0]]
	tmp.notes.push(Array.from({length: options.columns}, 
		() => Math.round(Math.random()))	
	)
	for(let i=0; i<tmp.failedColumns.length; i++){
		if(tmp.failedColumns[i] === 0){
			if(1 === tmp.notes[0][i] && 0 === tmp.notes[1][i] ||
				 tmp.state[i] === 0 && tmp.notes[0][i] === 0
			){
				tmp.failedColumns[i] = 1
			}
		}
	}
	tmp.notes.shift()
	tmp.positionOffset = -1*options.hitPosition
	tmp.lastAdded = Date.now()

	//capture late presses/lifts
	setTimeout(() => {
		for(let i=0; i < tmp.notes[0].length; i++){
			/*if(tmp.state[i]!==tmp.notes[0][i]){
				
				tmp.failedColumns[i]=0
			}*/
			//LN started
			if(tmp.lastNotes[i] === 0 && tmp.notes[0][i] === 1){
				if(lastState[i] === 0 && tmp.state[i] === 1){
					//late hit
					combo(1, false, i)
					tmp.failedColumns[i]=1
				} else if
					//exact or early hit
				(tmp.state[i] === 1 && Date.now() - tmp.stateChange[i] < options.hitWindow*2){
					combo(1, false, i)
					tmp.failedColumns[i]=1
				} else if
					//didn't hit
				(tmp.state[i]===0){
					combo(0, false, i)
					tmp.failedColumns[i]=0
				} else if 
					//hold instead of pressing
				(tmp.state[i]===1 && Date.now() - tmp.stateChange[i] > options.hitWindow*2){
					combo(0, false, i)
					tmp.failedColumns[i]=0
				}
			//LN ended
			} else if (tmp.lastNotes[i] === 1 && tmp.notes[0][i] === 0){
				//unfail every column without a note
				tmp.failedColumns[i]=1
				if(lastState[i] === 1 && tmp.state[i] === 0){
					//late lift
					combo(1, false, i)
				} else if
					//exact or early lift
				//(lastState[i] === 1 && tmp.state[i] === 0 && Date.now() - tmp.stateChange < options.hitWindow*2){
					//combo(1)
				//} else if
				//didn't lift
				(tmp.state[i]===1){
					combo(0, false, i)
				}
			}
		}
	}, options.hitWindow);
}

function getLnLength(column){
	for(let i=0; i<tmp.notes.length; i++){
		if(tmp.notes[i][column]!==1)return(i)
	}
}

function combo(num, reset=false, column=undefined){
	if(num === 0){
		tmp.combo = 0
	} else if
	(num === 1){
		tmp.combo++
	}
	document.getElementById("combo").textContent = tmp.combo
	if(column!==undefined){
		//draw hit/miss icons
		bctx.beginPath()
		bctx.arc(column*options.width+options.width/2, Number(options.hitPosition)+20, 10, 0,Math.PI*2)
		if (num==1) bctx.fillStyle = "green"
		else bctx.fillStyle = "red";
		bctx.fill()
	}
	if(tmp.combo > tmp.bestcombo || reset){
		tmp.bestcombo = tmp.combo
		document.getElementById("bestcombo").textContent = "Best combo: "+tmp.bestcombo
		document.getElementById("combodifficulty").innerHTML = "at "+options.BPM+" BPM, "+options.scrollSpeed+"ms speed, <br>"+options.columns+"k, "+options.hitWindow+"ms hit window"
	}
}

function applyOptions(){
	options.BPM = document.getElementById("bpm").value
	options.scrollSpeed = document.getElementById("scrollspeed").value
	options.hitPosition = document.getElementById("hitposition").value
	options.columns = document.getElementById("columns").value
	options.width = document.getElementById("columnwidth").value
	options.hitWindow = document.getElementById("hitwindow").value
	setup()
}

function saveOptions(){
	localStorage.setItem("LNtr-options", JSON.stringify(options))
}

function resetPB(){
	combo(0, true)
}


window.onload = ()=>{
	setup()
	draw()
} 


window.addEventListener("keydown",(e) => {
	if (e.repeat) return
	let column = options.controls[options.columns].indexOf(e.code)
	if (column !== -1) {
		const now = Date.now()
		const delta = Date.now() - tmp.lastAdded
		tmp.state[column] = 1
		tmp.stateChange[column] = now
		
		//timings :DDDDD
	/*	if(delta < options.hitWindow || delta > (1000*(60/options.BPM)-options.hitWindow)){
			if (delta <= options.hitWindow){
				//late
			} else {
				//early
				//combo(1)
			}

		}*/
	}
})
window.addEventListener("keyup",(e) => {
	if (e.repeat) return
	let column = options.controls[options.columns].indexOf(e.code)
	if (column !== -1) {
		tmp.state[column] = 0
		//if released mid-ln
		const now = Date.now()
		const delta = Date.now() - tmp.lastAdded
		if(delta < options.hitWindow || delta > (1000*(60/options.BPM)-options.hitWindow)){
			if (delta <= options.hitWindow){
				if(tmp.notes[0][column] === 0){
					//late lift

				} else if
				(tmp.notes[0][column] === 1){
					tmp.failedColumns[column] = 0
					combo(0, false, column)
				}
			} else {
				if(tmp.notes[0][column] === 1 && tmp.notes[1][column] === 0){
					//early lift
					combo(1, false, column)
				} else {
					//failed lift
					tmp.failedColumns[column] = 0
					combo(0, false, column)
				}
			}

		}
		else if (tmp.notes[0][column] === 1){
			tmp.failedColumns[column] = 0
			combo(0, false, column)
		}
	}
})