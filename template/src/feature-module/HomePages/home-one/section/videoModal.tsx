import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-bootstrap';
import ReactPlayer from 'react-player';
interface modals {
  show:boolean,
  handleClose:any,
  videoUrl:string
}

const VideoModal = ({ show, handleClose, videoUrl }:modals) => {
  const { t } = useTranslation()
  return (
    <Modal className='video-modal' show={show} centered size='xl' onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title></Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <ReactPlayer url={videoUrl} playing={true} controls={true} width='100%' height='80vh'/>
    </Modal.Body>
    
  </Modal>
  )
}

export default VideoModal