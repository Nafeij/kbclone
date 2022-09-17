import img0 from "../img/0.png"
import img1 from "../img/1.png"
import img2 from "../img/2.png"
import img3 from "../img/3.png"
import img4 from "../img/4.png"
import img5 from "../img/5.png"

/* const Profile = {
    imgs : [img0,img1,img2,img3,img4,img5],
    names : ['The Lamb', 'Ratau', 'Flinky', 'Klunko & Bop', 'Shrumy', 'The Fox'],
    skill : [-1,.1,.25,.5,.9,1]
} */

const Profile = {
    cosm : {
        lamb : {img : img0, name : 'The Lamb'},
        placeHolder : {img : img0, name : 'TEMP'}
    },
    ai : {
        rat : {img : img1, name : 'Ratau', skill : .1, effects : []},
        snake : {img : img2, name : 'Flinky', skill : .25, effects : []},
        bird : {img : img3, name : 'Klunko & Pop', skill : .5, effects : []},
        tort : {img : img4, name : 'Shrumy', skill : .9, effects : []},
        fox : {img : img5, name : 'The Fox', skill : 1, effects : ['cheat']}
    }
} 

export default Profile