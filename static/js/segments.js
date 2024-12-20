function saveSegmentChanges(index) {
    const segment = transcription.segments[index];

    fetch('/update_segment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            index: index,
            start_time: segment.start,
            end_time: segment.end,
            text: segment.text
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Segment updated successfully');
            updateFullTranscription();
        } else {
            console.error('Failed to update segment');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function addSegment() {
    const videoDuration = getDuration();
    const selectedIndex = currentlySelectedSegmentIndex !== null ? currentlySelectedSegmentIndex : -1;
    
    fetch('/add_segment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            start_time: 0,
            end_time: videoDuration,
            text: "",
            selected_index: selectedIndex
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            transcription = data.transcription;
            displaySegmentedTranscription(transcription.segments, data.is_sorted);
            updateFullTranscription();
            isListSorted = data.is_sorted;
            updateSortButtonVisibility();
            
            // If a segment was selected, highlight the new segment
            if (selectedIndex !== -1) {
                handleSegmentClick(selectedIndex + 1);
            }
        } else {
            console.error('Failed to add segment');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function removeSegment(index) {
    fetch('/remove_segment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            index: index
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            transcription = data.transcription;
            displaySegmentedTranscription(transcription.segments);
            updateFullTranscription();
            
            // If we removed the currently playing segment, reset the player
            if (index === currentlySelectedSegmentIndex) {
                clearSegmentSelection();
            }
        } else {
            console.error('Failed to remove segment');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateSegmentTimes(index, isManualInput = false, timeType = 'both') {
    const segmentDiv = document.querySelector(`.segment-container[data-index="${index}"]`);
    const startInput = segmentDiv.querySelector('.segment-start');
    const endInput = segmentDiv.querySelector('.segment-end');
    const timeSpan = segmentDiv.querySelector('.segment-time');

    const videoDuration = getDuration();
    let newStart = parseFloat(startInput.value);
    let newEnd = parseFloat(endInput.value);

    if (timeType === 'start' || timeType === 'both') {
        newStart = Math.max(0, Math.min(newStart, newEnd, videoDuration));
        startInput.value = newStart.toFixed(2);
    }

    if (timeType === 'end' || timeType === 'both') {
        newEnd = Math.min(Math.max(newStart, newEnd), videoDuration);
        endInput.value = newEnd.toFixed(2);
    }

    const duration = (newEnd - newStart).toFixed(2);
    timeSpan.textContent = `${duration}s`;

    if (!isManualInput || Math.abs(newStart - transcription.segments[index].start) > 0.01 || Math.abs(newEnd - transcription.segments[index].end) > 0.01) {
        transcription.segments[index].start = newStart;
        transcription.segments[index].end = newEnd;

        saveSegmentChanges(index);

        isListSorted = false;
        updateSortButtonVisibility();
    }

    return timeType === 'start' ? newStart : newEnd;
}

function updateSegmentText(index) {
    const segmentDiv = document.querySelector(`.segment-container[data-index="${index}"]`);
    const textArea = segmentDiv.querySelector('.segment-text');

    transcription.segments[index].text = textArea.value;
    saveSegmentChanges(index);
    debouncedUpdateFullTranscription();
}

function sortSegments() {
    fetch('/sort_segments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            transcription = data.transcription;
            displaySegmentedTranscription(transcription.segments);
            updateFullTranscription();
            console.log('Segments sorted successfully');
            isListSorted = true;
            updateSortButtonVisibility();
        } else {
            console.error('Failed to sort segments');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}