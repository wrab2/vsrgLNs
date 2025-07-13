const canvas = document.getElementById("field")
const ratingscanvas = document.getElementById("ratings")

class stageClass {
	constructor(field, ratings) {
		this.stage = field
		this.ctx = this.stage.getContext("2d")
		this.overlay = ratings
		this.height = 0
		this.width = 0
		this.notes = {
			height: 0,
			lastAdded: 0,
		}
		this.draw = {
			notes: (diff) => this.drawNotes(diff),
			separators: () => this.drawSeparators(),
			judgementLine: () => this.drawJudgementLine()
		}

		this.resize()
		window.addEventListener("resize", this.resize.bind(this));
	}
	resize(){
		this.height = window.innerHeight - 10
		this.width = options.width * options.columns
		this.stage.height = this.height
		this.stage.width = this.width
		this.overlay.height = this.height
		this.overlay.width = this.width
		//height per ms * ms per bpm
		this.notes.height = (this.height / options.scrollSpeed) * (1000*(60/options.BPM))
	}
	clear(){
		this.ctx.fillStyle = "black"
		this.ctx.rect(0,0,this.width,this.height)
		this.ctx.fill()
	}
	drawNotes(diff){
		tmp.positionOffset += (this.height / options.scrollSpeed)*diff
		for(let x=0; x<20; x++){
			const notes = tmp.notes[x]
			if(((this.notes.height*x)-tmp.positionOffset)>this.height)break
			for(let i=0; i < notes.length; i++){
				if(notes[i] === 1){
					this.ctx.beginPath()
					this.ctx.rect((i*(options.width * options.columns)/options.columns), (this.notes.height*x)-tmp.positionOffset,((options.width * options.columns)/options.columns),this.notes.height+1)
					this.ctx.closePath()
					this.ctx.fillStyle = colors[options.columns][i]
					this.ctx.fill()
					if(getLnLength(i)>=x && tmp.failedColumns[i]===0){
						this.ctx.fillStyle="#00000030"
						this.ctx.fill()
					}
				}
			}
		}
	}
	drawSeparators(){
		this.ctx.beginPath()
		for(let i=1; i<options.columns;i++){
			this.ctx.moveTo(i * (options.width * options.columns) / options.columns, 0)
			this.ctx.lineTo(i * (options.width * options.columns) / options.columns, this.height)
		}
		this.ctx.closePath()
		this.ctx.strokeStyle = "gray"
		this.ctx.lineWidth = "1"
		this.ctx.stroke()
	}
	drawJudgementLine(){
		for(let i=0; i<options.columns; i++){
			this.ctx.beginPath()
			this.ctx.moveTo(i*(options.width * options.columns) / options.columns, options.hitPosition)
			this.ctx.lineTo((i+1)*(options.width * options.columns) / options.columns, options.hitPosition)
			this.ctx.closePath()
			if(tmp.inputState[i] === key.down){
				this.ctx.lineWidth = "5"
				this.ctx.strokeStyle = "green"
				this.ctx.stroke()
				if(tmp.failedColumns[i]===1){
					this.ctx.rect(i*(options.width * options.columns)/options.columns, options.hitPosition, (options.width * options.columns)/options.columns, -1*options.hitPosition)
					this.ctx.fillStyle="black"
					this.ctx.fill()
				}
			} else {
				this.ctx.lineWidth = "2"
				this.ctx.strokeStyle = "white"
				this.ctx.stroke()
			}
		}
	}
}

class comboClass {
	constructor(element, overlay){
		this.element = element
		this.overlayCtx = overlay.getContext("2d")
		this.current = 0
		this.best = 0
		this.displayCombo()
	}
	displayCombo(){
		this.element.textContent = this.current
	}
	displayPB(){
		document.getElementById("bestcombo").textContent = "Best combo: "+this.best
		document.getElementById("combodifficulty").innerHTML = "at "+options.BPM+" BPM, "+options.scrollSpeed+"ms speed, <br>"+options.columns+"k, "+options.hitWindow+"ms hit window"
	}
	hit(column){
		this.current++
		if(this.current>this.best){
			this.best = this.current
			this.displayPB()
		}
		this.displayCombo()
		this.drawJudgementCircle(column, true)
	}
	miss(column){
		this.current = 0
		this.displayCombo()
		this.drawJudgementCircle(column, false)
	}
	reset(){
		this.best = 0
		this.current = 0
		this.displayCombo()
		this.displayPB()
	}
	drawJudgementCircle(column, hit){
		this.overlayCtx.beginPath()
		this.overlayCtx.clearRect(column*options.width+options.width/2-11,Number(options.hitPosition)+9,22,22)
		this.overlayCtx.arc(column*options.width+options.width/2, Number(options.hitPosition)+20, 10, 0,Math.PI*2)
		if (hit) this.overlayCtx.fillStyle = "green"
		else this.overlayCtx.fillStyle = "red";
		this.overlayCtx.fill()
	}
}

class patternClass {
	constructor(name, columns) {
    	this.next = this[name]
    	this.columns = columns
		this.fullHoldCounter = 1
		this.bracketStart = 1
	}
	random(){
		return (Array.from({length: this.columns}, 
			() => Math.round(Math.random()))	
		)	
	}

	fullEveryOther(){
		this.fullHoldCounter = (this.fullHoldCounter+1)%2
		if(this.fullHoldCounter % 2 == 0){
			return (Array.from({length: this.columns},
				() => 1
			))
		} else {
			return (Array.from({length: this.columns}, 
				() => Math.round(Math.random())
			))
		}
	}

	brackets(){
		this.bracketStart = (this.bracketStart+1)%2
		let arr = []
		for(let i=0; i<this.columns; i++){
			arr.push((this.bracketStart+i%2)%2)
		}
		return arr
	}
}

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
	type:"random",
}
let saved = localStorage.getItem("LNtr-options")
if(saved!==null){
	let tempOptions = JSON.parse(saved)
	for (const i of Object.keys(tempOptions)){
		if(Object.keys(options).includes(i))
			options[i] = tempOptions[i];
	}
}
const key = {
	down: 1,
	up: 0
}
let tmp = {
	notes: [],
	lastNotes: Array.from({length: options.columns}, () => 0),
	positionOffset: -1*options.hitPosition,
	interval: undefined,
	inputState:[],
	stateChange:[],
	failedColumns:[],
	combo:0,
	bestcombo:0,
	editingControls: false,
	onkey:0,
}

function displayOptions(){
	document.getElementById("bpm").value = options.BPM
	document.getElementById("scrollspeed").value = options.scrollSpeed
	document.getElementById("hitposition").value = options.hitPosition
	document.getElementById("columns").value = options.columns
	document.getElementById("columnwidth").value = options.width
	document.getElementById("hitwindow").value = options.hitWindow
	document.getElementById("patterntype").value = options.type
}

const stage = new stageClass(canvas, ratingscanvas)
const combo = new comboClass(document.getElementById("combo"), stage.overlay)

function setup(){
	displayOptions()
	document.getElementById("field").focus()
	stage.resize()
	tmp.inputState = Array.from({length: options.columns}, () => key.up)
	//I don't know what this next line does, probably nothing
	tmp.stateChange = [...tmp.inputState]
	tmp.failedColumns = Array.from({length: options.columns}, () => 1)
	tmp.notes = []

	const pattern = new patternClass(options.type, options.columns)
	for (let i=0; i<30; i++){
		tmp.notes.push(pattern.next())
	}

	generateNotes(pattern)
	clearInterval(tmp.interval)
	tmp.interval = setInterval(() => {
		generateNotes(pattern)
	}, 1000*(60/options.BPM));
}
function draw() {
	const now = Date.now()
	const diff = now - tmp.lastUpdate
	tmp.lastUpdate = now

	stage.clear()
	stage.draw.notes(diff)
	stage.draw.separators()
	stage.draw.judgementLine()

	requestAnimationFrame(draw)
}


function generateNotes(pattern){
	let lastState = [...tmp.inputState]
	tmp.lastNotes = [...tmp.notes[0]]
	
	tmp.notes.push(pattern.next())

	for(let i=0; i<tmp.failedColumns.length; i++){
		if(tmp.failedColumns[i] === 0){
			if(1 === tmp.notes[0][i] && 0 === tmp.notes[1][i] ||
				 tmp.inputState[i] === key.up && tmp.notes[0][i] === 0
			){
				tmp.failedColumns[i] = 1
			}
		}
	}
	tmp.notes.shift()
	tmp.positionOffset = -1*options.hitPosition
	stage.notes.lastAdded = Date.now()

	//capture late presses/lifts
	setTimeout(() => {
		for(let i=0; i < tmp.notes[0].length; i++){
			//LN started
			if(tmp.lastNotes[i] === 0 && tmp.notes[0][i] === 1){
				if(lastState[i] === key.up && tmp.inputState[i] === key.down){
					//late hit
					combo.hit(i)
					tmp.failedColumns[i]=1
				} else if
					//exact or early hit
				(tmp.inputState[i] === key.down && Date.now() - tmp.stateChange[i] < options.hitWindow*2){
					combo.hit(i)
					tmp.failedColumns[i]=1
				} else if
					//didn't hit
				(tmp.inputState[i] === key.up){
					combo.miss(i)
					tmp.failedColumns[i]=0
				} else if 
					//hold instead of pressing
				(tmp.inputState[i] === key.down && Date.now() - tmp.stateChange[i] > options.hitWindow*2){
					combo.miss(i)
					tmp.failedColumns[i]=0
				}
			//LN ended
			} else if (tmp.lastNotes[i] === 1 && tmp.notes[0][i] === 0){
				//unfail every column without a note
				tmp.failedColumns[i]=1
				if(lastState[i] === key.down && tmp.inputState[i] === key.up){
					//late lift
					combo.hit(i)
				} else if
				//didn't lift
				(tmp.inputState[i] === key.down){
					combo.miss(i)
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


function applyOptions(){
	options.BPM = document.getElementById("bpm").value
	options.scrollSpeed = document.getElementById("scrollspeed").value
	options.hitPosition = document.getElementById("hitposition").value
	options.columns = document.getElementById("columns").value
	options.width = document.getElementById("columnwidth").value
	options.hitWindow = document.getElementById("hitwindow").value
	options.type = document.getElementById("patterntype").value
	setup()
}

function saveOptions(){
	localStorage.setItem("LNtr-options", JSON.stringify(options))
}

function editControls(key = undefined){
	tmp.editingControls = true
	if(key && tmp.onkey < options.columns){
		//assign the key
		options.controls[options.columns][tmp.onkey] = key
		tmp.onkey++
		if(tmp.onkey == options.columns){
			tmp.onkey = 0
			tmp.editingControls = false
			document.getElementById("controls").style.display = "none"
		}
	}
		let str = ""
		let str2 = ""
		for(let i=0; i<options.columns; i++){
			str+=`<td>${options.controls[options.columns][i]}</td>`
			str2+=`<td>${tmp.onkey === i?"^":""}</td>`
		}
		document.getElementById("row1ofcontrols").innerHTML = str.replace(/Key/g,"")
		document.getElementById("row2ofcontrols").innerHTML = str2
		if (key === undefined){
			return document.getElementById("controls").style.display = "flex"
		}
}

window.addEventListener("keydown",(e) => {
	if (e.repeat) return
	if (tmp.editingControls){
		return editControls(e.code)
	}
	let column = options.controls[options.columns].indexOf(e.code)
	if (column !== -1) {
		const now = Date.now()
		tmp.inputState[column] = key.down
		tmp.stateChange[column] = now
	}
})

window.addEventListener("keyup",(e) => {
	if (e.repeat) return
	let column = options.controls[options.columns].indexOf(e.code)
	if (column !== -1) {
		tmp.inputState[column] = key.up
		//if released mid-ln
		const delta = Date.now() - stage.notes.lastAdded
		if(delta < options.hitWindow || delta > (1000*(60/options.BPM)-options.hitWindow)){
			if (delta <= options.hitWindow){
				if(tmp.notes[0][column] === 0){
					//late lift

				} else if
				(tmp.notes[0][column] === 1){
					tmp.failedColumns[column] = 0
					combo.miss(column)
				}
			} else {
				if(tmp.notes[0][column] === 1 && tmp.notes[1][column] === 0){
					//early lift
					combo.hit(column)
				} else {
					//failed lift
					tmp.failedColumns[column] = 0
					combo.miss(column)
				}
			}

		}
		else if (tmp.notes[0][column] === 1){
			tmp.failedColumns[column] = 0
			combo.miss(column)
		}
	}
})

window.onload = ()=>{
	setup()
	draw()
} 