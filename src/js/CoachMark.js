import componentHandler from 'o-component-handler';

export default class CoachMark {

	constructor(element, opts, callback) {


		this.element = element;
		this.opts = opts;
		this.callback = callback;
		//Check options
		if(!opts)
			throw new Error('missing required parameter:' +
			' you must include an options object');

		if(!opts.text)
			throw new Error('missing required option: ' +
			'you must specify text for the coach mark');

		if (!opts.id) {
			throw new Error('missing required option: you must specify a unique id for the coach mark')
		}

		// check other args
		if (!element) {
			throw new Error('missing required option: element')
		}

		const placement = function placement() {
			// get window geometry - this is how jQuery does it
			const body = document.body,
				html = document.documentElement,
				height = Math.max(
					body.scrollHeight,
					body.offsetHeight,
					html.clientHeight,
					html.scrollHeight,
					html.offsetHeight),
				rect = element.getBoundingClientRect(),
				// 50 is close enough. This is very browser-specific
				touch_top = rect.top < 50,
				touch_left = rect.left < 50,
				touch_right = window.innerWidth - rect.right < 50,
				touch_bottom = rect.bottom + 50 > height;

			if (touch_top) return 'bottom';
			if (touch_bottom) return 'top';
			if (touch_left && touch_right) return 'bottom';
			if (touch_right) return 'left';
			if (touch_left) return 'right';
			return 'bottom';
		}();


		// create relative parent for simplified positioning
		const positioner = document.createElement('div');
		positioner.style.display = 'inline-block';

		//Build html
		const container = document.createElement('div'),
			close = document.createElement('button'),
			closeSpan = document.createElement('span'),
			screenReader = document.createElement('span'),
			titleText = document.createElement('div'),
			content = document.createElement('div'),
			paragraph = document.createElement('p'),
			internalText = ('textContent' in titleText) ? 'textContent' : 'innerText';


		titleText.className = 'o-coach-mark__title';

		if (opts.title) titleText[internalText] = opts.title;

		//close.setAttribute('aria-label', 'close');
		close.className = 'o-coach-mark__close-icon';

		closeSpan[internalText] = '✕';
		closeSpan.setAttribute('aria-hidden', 'true');
		close.appendChild(closeSpan);

		screenReader.className="o-coach-mark__sr-hidden";
		screenReader[internalText] = opts.srText || "close this coach mark";
		close.appendChild(screenReader);

		container.className = 'o-coach-mark__container';
		container.style.visibility = 'hidden';
		container.style.display = 'block';
		container.style.position = 'absolute';
		content.style.margin = '0';
		content.className = 'o-coach-mark__content';
		content.className += ' o-coach-mark--' + placement;
		content.appendChild(close);
		content.appendChild(titleText);
		paragraph[internalText] = opts.text;

		content.appendChild(paragraph);
		if (opts.hasBack || opts.hasNext) {
			const backNextDiv = document.createElement('div'),
				back = document.createElement('button'),
				backSpan = document.createElement('span'),
				next = document.createElement('button'),
				nextSpan = document.createElement('span'),
				totalOfCoachMarksSpan = document.createElement('span');

			back.setAttribute('type', 'button');
			back.className = 'o-coach-mark__button-space';

			backSpan[internalText] = 'Back';
			back.appendChild(backSpan);
			//build next button
			next.setAttribute('type', 'button');
			next.className = 'o-coach-mark__next-button';

			nextSpan[internalText] = 'Next';
			next.appendChild(nextSpan);
			
			totalOfCoachMarksSpan.className = 'o-coach-mark__total-coachmarks';
			totalOfCoachMarksSpan[internalText] = opts.currentCM + '/' + opts.totalCM;

			backNextDiv.appendChild(back);
			backNextDiv.appendChild(next);
			backNextDiv.appendChild(totalOfCoachMarksSpan);
			content.appendChild(backNextDiv);
			eventOnClick(back);
			eventOnClick(next);

			function eventOnClick(parent) {
				const buttonIs = opts.hasNext ? 'nextButton' : 'backButton';
				parent.onclick = function(event) {
					triggerEvent(buttonIs, 'o-cm-backNext-clicked');
					event.preventDefault();
				};
			}
		}
		content.style.position = 'relative';
		container.appendChild(content);

		if (opts.like) {

			let likeDiv;
			let feedBack;
			
			this.appendAnchor = (parent, upDown, text, like) => {
				const link = document.createElement('a');
				link.onclick = function(event) {
					triggerEvent(like, 'o-cm-like-clicked');
					likeDiv.style.display = 'none';
					feedBack.style.display = 'block';
					event.preventDefault();
				};
				link.innerHTML = text;
				link.className = 'o-coach-mark--link-text';
				link.setAttribute('href', '#');
				const likeImg = document.createElement('i');
				likeImg.className = 'o-coach-mark--icons fa fa-thumbs-o-' + upDown;
				likeImg.setAttribute('aria-hidden', 'true');
				link.insertBefore(likeImg, link.childNodes[0]);
				parent.appendChild(link);
			};

			const hr = document.createElement('hr'),
				form = document.createElement('textarea'),
				buttonBar = document.createElement('div'),
				submit = document.createElement('button'),
				question = document.createElement('p'),
				instructions = document.createElement('p'),
				cancel = document.createElement('a');

			hr.className = 'o-coach-mark--hr';
			content.appendChild(hr);

			likeDiv = document.createElement('div');
			likeDiv.className = 'o-coach-mark__like-div';
			question.innerHTML = 'What do you think of this change?';
			likeDiv.appendChild(question);
			content.appendChild(likeDiv);
			this.appendAnchor(likeDiv, 'down', 'Not Great', 'dislike');
			this.appendAnchor(likeDiv, 'up', 'I Like It', 'like');
			feedBack = document.createElement('div');
			feedBack.className = 'o-coach-mark__feedback';
			instructions.innerHTML = 'Thanks! Care to tell us more?';
			feedBack.appendChild(instructions);
			submit.innerHTML = 'submit';
			submit.onclick = () => {
				triggerEvent('submit', 'o-cm-submit-clicked', form.value);
			};
			cancel.innerHTML = 'cancel';
			cancel.setAttribute('href', '#');
			cancel.onclick = () => {
				triggerEvent('cancel', 'o-cm-cancel-clicked');
				likeDiv.style.display = 'block';
				feedBack.style.display = 'none';
			};
			feedBack.appendChild(form);
			buttonBar.appendChild(submit);
			buttonBar.appendChild(cancel);
			feedBack.appendChild(buttonBar);
			content.appendChild(feedBack);
		}

		function triggerEvent(elementClickedIS, eventIs, payload) {
			let event;
			if (document.createEvent) {
				event = document.createEvent('HTMLEvents');
				event.initEvent(eventIs, true, true);
			} else {
				event = document.createEventObject();
				event.eventType = eventIs;
			}

			event.eventName = eventIs;
			event.data = {
				type: elementClickedIS,
				id: opts.id,
				payload: payload
			};

			if (document.createEvent) {
				element.dispatchEvent(event);
			} else {
				element.fireEvent("on" + event.eventType, event);
			}
		}


		function resetPosition() {

			const featurePosition = element.getBoundingClientRect(),
				markHeight = content.offsetHeight + 10,
				markWidth = container.offsetWidth,
				horizontal_center = ((featurePosition.right + featurePosition.left) / 2 + featurePosition.left) + 'px',
				vertical_center = ((featurePosition.bottom - featurePosition.top)/2 + featurePosition.top) + 'px';

			container.style.visibility = 'hidden';

			switch (placement) {
				case 'bottom':
					container.style.top = featurePosition.bottom + 'px';
					container.style.left = horizontal_center;
					break;
				case 'top':
					container.style.top = (featurePosition.top - markHeight) + 'px';
					container.style.left = horizontal_center;
					break;
				case 'right':
					container.style.top = vertical_center;
					container.style.left = (featurePosition.right + window.pageXOffset) + 'px';
					break;
				case 'left':
					container.style.top = vertical_center;
					container.style.left = (featurePosition.left + window.pageXOffset - markWidth) + 'px';
					break;
			}
			container.style.visibility = 'visible';
		}

		//Inject html - use classes to position
		positioner.appendChild(container);
		element.parentNode.insertBefore(positioner, element.nextSibling);

		// temporarily show for measuring
		container.style.visibility = 'visible';

		resetPosition();

		window.addEventListener("resize", resetPosition);

		close.addEventListener('click', function(event) {
			container.style.visibility = 'hidden';
			callback(opts.id, event);
		});
	}
}

componentHandler.register({
	constructor: CoachMark,
	classAsString: 'CoachMark',
	cssClass: 'o-coach-mark'
});
