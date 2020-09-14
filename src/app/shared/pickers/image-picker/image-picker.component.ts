import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Plugins, Capacitor, CameraSource, CameraResultType } from '@capacitor/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
  selectedImage: string;
  usePicker = false;
  @Output() imagePick = new EventEmitter<string | File>();
  @ViewChild('filePicker') filePickerRef: ElementRef<HTMLInputElement>;

  constructor(private platform: Platform) { }

  ngOnInit() {
    console.log('Mobile: ',this.platform.is('mobile'))
    console.log('Hybrid: ',this.platform.is('hybrid'))
    console.log('iOS: ',this.platform.is('ios'))
    console.log('Android: ',this.platform.is('android'))
    console.log('Desktop: ',this.platform.is('desktop'))

    //Desktop Device
    if((this.platform.is('mobile') && !this.platform.is('hybrid')) || this.platform.is('desktop')){
      this.usePicker = true;  // File Picker instead of Camera
    }
  }

  onPickImage(){
    if(!Capacitor.isPluginAvailable('Camera') || this.usePicker){ // Backup plan if camera not available
      this.filePickerRef.nativeElement.click();
      return;
    }

    Plugins.Camera.getPhoto({
      quality: 50,
      source: CameraSource.Prompt,    // Prompt for either camera or gallery
      correctOrientation: true,
      height: 320,
      width: 200,
      resultType: CameraResultType.DataUrl
    }).then(image => {
      this.selectedImage = image.dataUrl;
      this.imagePick.emit(image.dataUrl);
    }).catch(error => {
      console.log(error);
      //TODO - implement alternative
      return false;
    });
  }

  onFileChosen(event: Event){
    const pickedfile = (event.target as HTMLInputElement).files[0];
    if(!pickedfile){
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = fr.result.toString();
      this.selectedImage = dataUrl;
      this.imagePick.emit(pickedfile);
    };
    fr.readAsDataURL(pickedfile);
  }
}
