

# NewLang

Introducing NewLang: A Language based on George Orwells
//INTRO GOES HERE


## Language Overview:

### Features:

// FEATURES GO HERE

### Comments:

<table>
<tr> <th>blvd</th><th>JavaScript</th> </tr>
<tr>
<td>

<code>(note: take a drive through Sunset Blvd!)</code>

</td>
<td>

<code>//take a drive through Sunset Blvd!</code>

</td>
</tr> </table>

## Example Programs:

### Hello World

<table>
<tr> <th>blvd</th><th>JavaScript</th> </tr>
<tr>
<td>

<code>say "Hello, World!"--</code>

</td>
<td>

<code>console.log("Hello, World!")</code>

</td>
</tr> </table>

### Variable Declaration

<table>
<tr> <th>blvd</th><th>JavaScript</th> </tr>
<tr>
<td>

<code>CAST string actor as "lead"--</code>

</td>
<td>

<code>let actor = "lead"</code>

</td>
</tr> </table>

### Assignment Statement

<table>
<tr> <th>blvd</th><th>JavaScript</th> </tr>
<tr>
<td>

<code>RECAST x as x + 1--</code>

</td>
<td>

<code>x = x + 1</code>

</td>
</tr> </table>

### Functions

<table>
<tr> <th>blvd</th><th>JavaScript</th> </tr>
<tr>
<td>
<code>SCENE string getFreeway has string fwy: 
    CAST string  fwy1 as "405"--
    EXIT WITH fwy1--
END SCENE
</code>

</td>
<td>
<code>function getFreeway(fwy){
    let fwy1 = "405"
    return fwy1
}
</code>
</td>
</tr> </table>

### Loops

<table>
<tr> <th>blvd</th><th>JavaScript</th> </tr>
<tr>
<td>
<code>ACTION number stars in range from 1, 6:
    say stars--
CUT
</code>
</td>
<td>
<code>for(let stars = 1; stars < 6; stars++){
    console.log(stars)
}
</code>
</td>
</tr>

<td>
<code>CAST number rating as 1--
PERFORM rating <= 5:
    say "less than 5 stars"--
</code>
</td>
<td>
<code>let rating = 1
while(rating <= 5){
    console.log(rating)
}
</code>
</td>
</tr> </table>

### Conditionals

<table>
<tr> <th>blvd</th><th>JavaScript</th> </tr>
<tr>
<td>
<code>NOMINATE review is 1:
    say "1 Star"--
RUNNER-UP review is 2:
    say "2 Stars"--
SUPPORTING:
    say "3 or more stars"--
</code>
</td>
<td>
<code>if(review == 1) {
    console.log("1 Star")
} 
else if(review == 2){
    console.log("2 Star")
} 
else {
    console.log("3 or more stars")
}
</code>
</td>
</tr> </table>
